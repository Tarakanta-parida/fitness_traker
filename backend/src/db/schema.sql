-- LifeTrack Database DDL Schema (9-Table Normalized)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (houses core auth & physical dimensions)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    age INT DEFAULT 28,
    gender VARCHAR(20) DEFAULT 'other',
    height NUMERIC(5, 2) DEFAULT 175.00,
    weight NUMERIC(5, 2) DEFAULT 70.00,
    goal VARCHAR(20) DEFAULT 'maintain', -- 'lose', 'gain', 'maintain'
    budget NUMERIC(10, 2) DEFAULT 150.00,
    is_onboarded BOOLEAN DEFAULT FALSE,
    steps_target INT DEFAULT 10000,
    sleep_target NUMERIC(4, 2) DEFAULT 8.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Daily Activity Table (steps, distance, exercise)
CREATE TABLE IF NOT EXISTS daily_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    steps INT DEFAULT 0,
    distance NUMERIC(5, 2) DEFAULT 0.00, -- in km
    calories_burned INT DEFAULT 0,
    exercise_time INT DEFAULT 0, -- in minutes
    date DATE NOT NULL,
    UNIQUE (user_id, date)
);

-- 3. Water Intake Table
CREATE TABLE IF NOT EXISTS water_intake (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    glasses INT DEFAULT 0, -- number of glasses (250ml units)
    goal INT DEFAULT 12,    -- target glasses (e.g. 3000ml / 250 = 12)
    date DATE NOT NULL,
    UNIQUE (user_id, date)
);

-- 4. Exercise Table (individual logs of exercises/sports done)
CREATE TABLE IF NOT EXISTS exercise (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_name VARCHAR(100) NOT NULL,
    duration INT NOT NULL, -- in minutes
    calories INT NOT NULL, -- calories burned
    date DATE NOT NULL
);

-- 5. Meals Table (individual meals logs/plans)
CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meal_type VARCHAR(50) NOT NULL, -- 'breakfast', 'lunch', 'dinner', 'snacks'
    food_name VARCHAR(150) NOT NULL,
    calories INT NOT NULL,
    protein INT NOT NULL, -- in grams
    price NUMERIC(6, 2) DEFAULT 0.00, -- estimated price
    date DATE NOT NULL,
    UNIQUE (user_id, meal_type, date)
);

-- 6. Grocery List Table (items compilation for shopping weeks)
CREATE TABLE IF NOT EXISTS grocery_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week VARCHAR(50) NOT NULL, -- YYYY-WW (representing year and calendar week)
    item VARCHAR(100) NOT NULL,
    quantity VARCHAR(50) NOT NULL,
    price NUMERIC(6, 2) NOT NULL DEFAULT 0.00
);

-- 7. Sleep Table
CREATE TABLE IF NOT EXISTS sleep (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hours NUMERIC(4, 2) DEFAULT 0.00,
    quality VARCHAR(50) DEFAULT 'good', -- 'excellent', 'good', 'neutral', 'poor'
    date DATE NOT NULL,
    UNIQUE (user_id, date)
);

-- 8. Reminder Table (holds list of notification alert schedules)
CREATE TABLE IF NOT EXISTS reminder (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'water', 'exercise', 'sleep', 'meal'
    time TIME NOT NULL,
    repeat VARCHAR(100) DEFAULT 'daily', -- 'daily', 'weekdays', 'none'
    enabled BOOLEAN DEFAULT TRUE,
    UNIQUE (user_id, type)
);

-- 9. Progress Table (logs historical weight and body fat trends)
CREATE TABLE IF NOT EXISTS progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight NUMERIC(5, 2) NOT NULL,
    bmi NUMERIC(4, 2) NOT NULL,
    body_fat NUMERIC(4, 2) DEFAULT 18.5,
    date DATE NOT NULL,
    UNIQUE (user_id, date)
);

-- Indexing optimizations
CREATE INDEX IF NOT EXISTS idx_activity_user_date ON daily_activity(user_id, date);
CREATE INDEX IF NOT EXISTS idx_water_user_date ON water_intake(user_id, date);
CREATE INDEX IF NOT EXISTS idx_exercise_user_date ON exercise(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_grocery_user_week ON grocery_list(user_id, week);
CREATE INDEX IF NOT EXISTS idx_sleep_user_date ON sleep(user_id, date);
CREATE INDEX IF NOT EXISTS idx_reminder_user ON reminder(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_date ON progress(user_id, date);
