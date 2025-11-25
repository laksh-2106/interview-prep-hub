# InterviewPrep - Full Stack Interview Practice Platform

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [Authentication System](#authentication-system)
6. [Features](#features)
7. [Project Structure](#project-structure)
8. [Setup Instructions](#setup-instructions)
9. [How Each Component Works](#how-each-component-works)
10. [Security Implementation](#security-implementation)

---

## 🎯 Project Overview

**InterviewPrep** is a full-stack web application designed to help users practice interview questions and track their progress. The platform provides curated interview questions across different categories (Technical, Behavioral, System Design) with difficulty levels, tips, and example answers.

### Key Features:
- User authentication (Sign up/Sign in)
- Browse interview questions by category
- Practice questions with a dedicated interface
- Track progress (In Progress, Completed)
- Save practice notes
- Responsive design with modern UI

---

## 🛠 Technology Stack

### Frontend
- **React 18.3.1** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and development server
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library built on Radix UI
- **Lucide React** - Icon library

### Backend (Lovable Cloud/Supabase)
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication system
  - Row Level Security (RLS)
  - Real-time capabilities

### State Management & Data Fetching
- **TanStack Query (React Query)** - Server state management
- **Context API** - Authentication state

---

## 🏗 Architecture

The application follows a modern full-stack architecture:

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   Landing    │  │     Auth     │  │ Dashboard │ │
│  │     Page     │  │     Page     │  │   Page    │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │          Protected Routes Layer               │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │        Authentication Context (useAuth)       │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         ↕
          ┌──────────────────────────────┐
          │   Supabase Client Library    │
          └──────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────┐
│              Supabase Backend (Cloud)                │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  PostgreSQL  │  │     Auth     │  │    RLS    │ │
│  │   Database   │  │    System    │  │ Policies  │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 💾 Database Schema

### 1. **profiles** Table
Stores user profile information.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,                    -- References auth.users(id)
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user',               -- 'user' or 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**RLS Policies:**
- Users can view, insert, and update their own profile
- No direct deletion allowed

---

### 2. **categories** Table
Stores interview question categories.

```sql
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,                              -- Lucide icon name
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**RLS Policies:**
- Anyone can view categories (SELECT)
- Only admins can insert, update, or delete categories

**Example Data:**
- Technical Questions (Code icon)
- Behavioral Questions (Users icon)
- System Design (Network icon)

---

### 3. **questions** Table
Stores interview questions.

```sql
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT,                        -- 'Easy', 'Medium', 'Hard'
  category_id UUID REFERENCES categories(id),
  tips TEXT,                              -- Helpful tips for answering
  example_answer TEXT,                    -- Example answer
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**RLS Policies:**
- Anyone can view questions (SELECT)
- Only admins can insert, update, or delete questions

---

### 4. **user_progress** Table
Tracks user progress on questions.

```sql
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  question_id UUID REFERENCES questions(id),
  status TEXT,                            -- 'in_progress', 'completed'
  notes TEXT,                             -- User's practice notes
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**RLS Policies:**
- Users can only view, insert, update, and delete their own progress

---

### Database Functions

#### 1. **handle_new_user()**
Automatically creates a profile when a user signs up.

```sql
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Trigger:**
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

#### 2. **update_updated_at()**
Automatically updates the `updated_at` timestamp.

```sql
CREATE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Applied to tables:** profiles, questions, user_progress

---

## 🔐 Authentication System

### Overview
The authentication system uses Supabase Auth with email/password authentication.

### Components

#### 1. **useAuth Hook** (`src/hooks/useAuth.tsx`)
Custom React hook that manages authentication state.

```typescript
interface AuthContextType {
  user: User | null;              // Current user
  session: Session | null;        // Current session (includes tokens)
  loading: boolean;               // Loading state
  signUp: (email, password, fullName) => Promise<{error}>;
  signIn: (email, password) => Promise<{error}>;
  signOut: () => Promise<void>;
}
```

**Key Features:**
- Listens to auth state changes using `onAuthStateChange`
- Stores both user and session objects
- Provides sign up, sign in, and sign out functions
- Handles email redirect after signup

---

#### 2. **ProtectedRoute Component** (`src/components/ProtectedRoute.tsx`)
Wrapper component that protects routes requiring authentication.

**How it works:**
1. Checks if user is authenticated
2. Shows loading spinner while checking
3. Redirects to `/auth` if not authenticated
4. Renders children if authenticated

**Usage:**
```tsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

---

#### 3. **Auth Page** (`src/pages/Auth.tsx`)
Provides UI for both sign in and sign up.

**Features:**
- Tabbed interface (Sign In / Sign Up)
- Form validation
- Error handling with toast notifications
- Auto-redirect to dashboard after successful authentication
- Email redirect configuration for signup

**Form Fields:**
- **Sign In:** Email, Password
- **Sign Up:** Full Name, Email, Password

---

### Authentication Flow

#### Sign Up Flow:
```
1. User enters full name, email, password
2. Frontend calls signUp() with emailRedirectTo
3. Supabase creates user in auth.users
4. Trigger (handle_new_user) creates profile in profiles table
5. User is authenticated (auto-confirm enabled)
6. Redirect to dashboard
```

#### Sign In Flow:
```
1. User enters email, password
2. Frontend calls signIn()
3. Supabase validates credentials
4. Session is created and stored
5. onAuthStateChange updates context
6. Redirect to dashboard
```

#### Sign Out Flow:
```
1. User clicks sign out
2. Frontend calls signOut()
3. Supabase clears session
4. onAuthStateChange updates context (user = null)
5. ProtectedRoute redirects to /auth
```

---

## ✨ Features

### 1. Landing Page (`src/pages/Index.tsx`)
**Purpose:** Welcome page and entry point for the application.

**Sections:**
- **Hero Section:** Main headline, description, CTA buttons
- **Features Section:** Highlights key features with icons
- **CTA Section:** Encourages users to sign up

**Dynamic Behavior:**
- Shows "Go to Dashboard" if user is logged in
- Shows "Get Started" and "Sign In" if not logged in

---

### 2. Authentication (`src/pages/Auth.tsx`)
**Purpose:** User registration and login.

**Features:**
- Tabbed interface for Sign In/Sign Up
- Form validation
- Error handling
- Success notifications
- Auto-redirect for authenticated users

---

### 3. Dashboard (`src/pages/Dashboard.tsx`)
**Purpose:** Main hub for browsing questions and categories.

**Features:**
- **Header:** Shows user email and sign-out button
- **Categories Section:** Grid of category cards with icons
- **Questions Section:** List of questions with difficulty badges
- **Filtering:** Click category to filter questions
- **Navigation:** Click question to view details

**Data Fetching:**
```typescript
// Fetch all categories
const { data: categories } = await supabase
  .from('categories')
  .select('*')
  .order('name');

// Fetch questions (optionally filtered by category)
const { data: questions } = await supabase
  .from('questions')
  .select('*')
  .eq('category_id', categoryId)  // if filtering
  .order('title');
```

---

### 4. Question Detail (`src/pages/QuestionDetail.tsx`)
**Purpose:** Practice individual questions and track progress.

**Features:**
- **Question Display:** Title, description, difficulty badge
- **Tips Section:** Helpful tips for answering
- **Example Answer:** Reference answer (expandable)
- **Practice Area:** Textarea for writing practice answers
- **Progress Tracking:** Save as "In Progress" or "Completed"
- **Notes Persistence:** Saves notes to database

**Data Flow:**
```typescript
// 1. Fetch question details
const { data: question } = await supabase
  .from('questions')
  .select('*')
  .eq('id', questionId)
  .single();

// 2. Fetch user's progress (if exists)
const { data: progress } = await supabase
  .from('user_progress')
  .select('*')
  .eq('question_id', questionId)
  .eq('user_id', user.id)
  .maybeSingle();

// 3. Save/update progress
const { error } = await supabase
  .from('user_progress')
  .upsert({
    user_id: user.id,
    question_id: questionId,
    notes: userAnswer,
    status: 'in_progress',
    updated_at: new Date().toISOString()
  });
```

---

## 📁 Project Structure

```
interview-prep/
├── public/
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── ... (other UI components)
│   │   ├── NavLink.tsx            # Custom navigation link
│   │   └── ProtectedRoute.tsx     # Auth guard component
│   ├── hooks/
│   │   ├── useAuth.tsx            # Authentication hook
│   │   ├── use-mobile.tsx         # Mobile detection hook
│   │   └── use-toast.ts           # Toast notifications hook
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts          # Supabase client instance
│   │       └── types.ts           # Auto-generated DB types
│   ├── lib/
│   │   └── utils.ts               # Utility functions (cn, etc.)
│   ├── pages/
│   │   ├── Index.tsx              # Landing page
│   │   ├── Auth.tsx               # Sign in/Sign up page
│   │   ├── Dashboard.tsx          # Main dashboard
│   │   ├── QuestionDetail.tsx     # Question practice page
│   │   └── NotFound.tsx           # 404 page
│   ├── App.tsx                    # Main app component with routes
│   ├── index.css                  # Global styles and design system
│   └── main.tsx                   # App entry point
├── supabase/
│   ├── config.toml                # Supabase configuration
│   └── migrations/                # Database migrations
├── .env                           # Environment variables
├── index.html                     # HTML entry point
├── package.json                   # Dependencies and scripts
├── tailwind.config.ts             # Tailwind configuration
├── tsconfig.json                  # TypeScript configuration
└── vite.config.ts                 # Vite configuration
```

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **bun**
- **Git**
- **VS Code** (recommended)

### Step 1: Clone the Repository
```bash
git clone <YOUR_GIT_URL>
cd interview-prep
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Variables
The `.env` file is automatically configured with Supabase credentials:
```env
VITE_SUPABASE_URL=https://rdpvosjyuypeokdenmgn.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
VITE_SUPABASE_PROJECT_ID=rdpvosjyuypeokdenmgn
```

### Step 4: Start Development Server
```bash
npm run dev
```

The app will be available at: **http://localhost:8080**

### Step 5: Build for Production
```bash
npm run build
npm run preview
```

---

## 🔧 How Each Component Works

### 1. **Design System** (`src/index.css`, `tailwind.config.ts`)

**Color Palette:**
```css
:root {
  /* Primary: Teal/Cyan */
  --primary: 186 100% 45%;
  --primary-foreground: 0 0% 100%;
  
  /* Background */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  
  /* UI Elements */
  --card: 0 0% 100%;
  --muted: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --border: 214.3 31.8% 91.4%;
}

.dark {
  /* Dark mode overrides */
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... other dark mode colors */
}
```

**Animations:**
- Fade in/out
- Scale in/out
- Slide animations
- Accordion animations

---

### 2. **Routing** (`src/App.tsx`)

```tsx
<BrowserRouter>
  <AuthProvider>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/question/:id" element={
        <ProtectedRoute><QuestionDetail /></ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </AuthProvider>
</BrowserRouter>
```

**Route Protection:**
- `/` - Public landing page
- `/auth` - Public authentication page
- `/dashboard` - Protected (requires login)
- `/question/:id` - Protected (requires login)

---

### 3. **State Management**

#### Global State (Authentication)
Uses React Context API via `useAuth` hook:
- User object
- Session object
- Loading state
- Auth functions

#### Server State (Data Fetching)
Uses TanStack Query for:
- Caching
- Automatic refetching
- Loading states
- Error handling

#### Local State
Uses React `useState` for:
- Form inputs
- UI toggles
- Component-specific data

---

### 4. **Data Fetching Patterns**

**Example: Fetching Questions**
```typescript
const [questions, setQuestions] = useState<Question[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchQuestions();
}, []);

const fetchQuestions = async (categoryId?: string) => {
  setLoading(true);
  
  let query = supabase
    .from('questions')
    .select('*')
    .order('title');
  
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    toast.error('Failed to load questions');
  } else {
    setQuestions(data || []);
  }
  
  setLoading(false);
};
```

---

## 🔒 Security Implementation

### Row Level Security (RLS)

**What is RLS?**
Row Level Security ensures users can only access data they're authorized to see. Policies are defined in PostgreSQL and enforced at the database level.

### RLS Policies in This Project

#### 1. **profiles Table**
```sql
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

#### 2. **categories Table**
```sql
-- Anyone can view categories
CREATE POLICY "Anyone can view categories"
ON categories FOR SELECT
USING (true);

-- Only admins can modify categories
CREATE POLICY "Admins can insert categories"
ON categories FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role = 'admin'
));
```

#### 3. **questions Table**
```sql
-- Anyone can view questions
CREATE POLICY "Anyone can view questions"
ON questions FOR SELECT
USING (true);

-- Only admins can modify questions
CREATE POLICY "Admins can insert questions"
ON questions FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role = 'admin'
));
```

#### 4. **user_progress Table**
```sql
-- Users can only see their own progress
CREATE POLICY "Users can view their own progress"
ON user_progress FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own progress
CREATE POLICY "Users can insert their own progress"
ON user_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own progress
CREATE POLICY "Users can update their own progress"
ON user_progress FOR UPDATE
USING (auth.uid() = user_id);
```

---

### Best Security Practices Implemented

1. **Never Trust Client-Side Data**
   - All authorization happens server-side via RLS
   - Admin checks happen in database policies

2. **Secure Password Storage**
   - Handled by Supabase Auth (bcrypt hashing)
   - Never stored in plain text

3. **JWT Tokens**
   - Session tokens stored in localStorage
   - Automatically included in Supabase requests
   - Auto-refresh enabled

4. **Input Validation**
   - Email format validation
   - Password strength requirements
   - Form validation on client and server

5. **HTTPS Only**
   - All API requests over HTTPS
   - Secure cookie settings

---

## 📊 Key Concepts Explained

### 1. **Why Store Both User and Session?**
```typescript
const [user, setUser] = useState<User | null>(null);
const [session, setSession] = useState<Session | null>(null);
```

- **User:** Basic user info (id, email, metadata)
- **Session:** Includes access tokens, refresh tokens, expiry
- Session is required for token refreshing and authorization

---

### 2. **Why Use `maybeSingle()` Instead of `single()`?**
```typescript
const { data: progress } = await supabase
  .from('user_progress')
  .select('*')
  .eq('question_id', questionId)
  .eq('user_id', user.id)
  .maybeSingle();  // ✅ Returns null if no data
  // .single();    // ❌ Throws error if no data
```

- `single()` throws error if no data found
- `maybeSingle()` returns `null` if no data found
- Better UX for optional data

---

### 3. **Why `upsert()` for Progress Tracking?**
```typescript
await supabase
  .from('user_progress')
  .upsert({
    user_id: user.id,
    question_id: questionId,
    notes: userAnswer,
    status: status,
    updated_at: new Date().toISOString()
  });
```

- `upsert()` = INSERT if doesn't exist, UPDATE if exists
- Simplifies logic (no need to check if record exists)
- Atomic operation (prevents race conditions)

---

### 4. **Why `SECURITY DEFINER` in Functions?**
```sql
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER          -- ✅ Run with function owner's privileges
SET search_path = public  -- ✅ Prevent SQL injection
AS $$...$$;
```

- `SECURITY DEFINER`: Function runs with creator's privileges
- Allows inserting into profiles even though user is just signing up
- `search_path = public`: Prevents schema-based attacks

---

## 🎨 Styling Approach

### Design Tokens
All colors, spacing, and typography are defined in CSS variables:

```css
/* Primary Color */
--primary: 186 100% 45%;  /* Teal */

/* Semantic Tokens */
--destructive: 0 84.2% 60.2%;  /* Red for errors */
--success: 142 76% 36%;         /* Green for success */

/* Gradients */
--gradient-primary: linear-gradient(135deg, 
  hsl(var(--primary)), 
  hsl(var(--primary-light))
);
```

### Utility Classes
```css
.gradient-hero { background: var(--gradient-primary); }
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
.shadow-elegant { box-shadow: var(--shadow-elegant); }
```

---

## 🧪 Testing Recommendations

### Manual Testing Checklist
- [ ] Sign up new user
- [ ] Sign in existing user
- [ ] View dashboard
- [ ] Filter questions by category
- [ ] View question details
- [ ] Save progress
- [ ] Mark question as completed
- [ ] Sign out
- [ ] Try accessing protected routes when logged out

---

## 📝 Future Enhancements

1. **Admin Dashboard**
   - Add/edit/delete questions
   - Manage categories
   - View user statistics

2. **Progress Analytics**
   - Charts showing completion rate
   - Time spent on questions
   - Difficulty breakdown

3. **Search & Filters**
   - Search questions by keyword
   - Filter by difficulty
   - Sort by various criteria

4. **Timed Practice Mode**
   - Set time limits for questions
   - Simulate real interview conditions

5. **Social Features**
   - Share progress with friends
   - Community-submitted questions
   - Discussion forums

---

## 📚 Additional Resources

### Official Documentation
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

### Learning Resources
- [React Router Tutorial](https://reactrouter.com/en/main/start/tutorial)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🤝 Contributing

To contribute to this project:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the MIT License.

---

## 💬 Support

For questions or issues:
- Open an issue on GitHub
- Contact the maintainers

---

**Built with ❤️ using Lovable Cloud**
