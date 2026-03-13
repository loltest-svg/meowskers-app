// ==========================================
//  TANSHU OS — Data Store (localStorage)
// ==========================================

import { generateId, getTodayStr } from './helpers.js';

let currentUser = '';
let KEYS = {};

export function initStoreForUser(username) {
    currentUser = username;
    const prefix = `sonaos_${username}_`;
    KEYS = {
        ROADMAP: prefix + 'roadmap',
        HABITS: prefix + 'habits',
        POMODORO: prefix + 'pomodoro',
        SETTINGS: prefix + 'settings',
        REMINDERS: prefix + 'reminders',
        TIMER_SETTINGS: prefix + 'timer_settings',
        MOODS: prefix + 'moods'
    };
}

// --- Generic CRUD ---
export function loadData(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.error('Failed to load data:', key, e);
        return null;
    }
}

export function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save data:', key, e);
    }
}

// --- Roadmap ---
export function loadRoadmap() {
    return loadData(KEYS.ROADMAP) || getSeedRoadmap();
}
export function saveRoadmap(data) { saveData(KEYS.ROADMAP, data); }

// --- Habits ---
export function loadHabits() {
    return loadData(KEYS.HABITS) || getSeedHabits();
}
export function saveHabits(data) { saveData(KEYS.HABITS, data); }

// --- Pomodoro ---
export function loadPomodoro() {
    return loadData(KEYS.POMODORO) || [];
}
export function savePomodoro(data) { saveData(KEYS.POMODORO, data); }

// --- Reminders ---
export function loadReminders() {
    return loadData(KEYS.REMINDERS) || [];
}
export function saveReminders(data) { saveData(KEYS.REMINDERS, data); }

// --- Exams / Deadlines (Doomsday Calendar) ---
export function loadExams() {
    return loadData(KEYS.EXAMS) || getSeedExams();
}
export function saveExams(data) { saveData(KEYS.EXAMS, data); }

// --- Timer Settings ---
export function loadTimerSettings() {
    return loadData(KEYS.TIMER_SETTINGS) || { focus: 25, shortBreak: 5, longBreak: 15 };
}
export function saveTimerSettings(data) { saveData(KEYS.TIMER_SETTINGS, data); }


// --- Moods ---
export function loadMoods() {
    return loadData(KEYS.MOODS) || [];
}
export function saveMoods(data) { saveData(KEYS.MOODS, data); }

// --- Seed Exams ---
function getSeedExams() {
    return [
        { id: generateId(), title: 'Midterm Exams', date: '2026-04-15', type: 'midterm', color: '#f472b6' },
        { id: generateId(), title: 'Project Deadline', date: '2026-03-28', type: 'deadline', color: '#c4b5fd' },
        { id: generateId(), title: 'End Term Exams', date: '2026-05-20', type: 'endterm', color: '#fda4af' }
    ];
}

// ==========================================
//  SEED DATA — Data Science & AI/ML Roadmap
// ==========================================
function getSeedRoadmap() {
    const nodes = {};
    const rootIds = [];

    function addNode(id, title, parentId, type, children = [], notes = '', resources = []) {
        nodes[id] = {
            id,
            title,
            parentId,
            childIds: children,
            completed: false,
            notes,
            resources,
            type,
            createdAt: new Date().toISOString()
        };
        return id;
    }

    // =====================
    // ROADMAP 1: Data Science & AI/ML
    // =====================
    const dsRoot = 'ds_root';
    rootIds.push(dsRoot);

    // Python Fundamentals
    addNode('ds_py', 'Python Fundamentals', dsRoot, 'skill', ['ds_py_syntax', 'ds_py_oop', 'ds_py_ds', 'ds_py_func'],
        'Master Python as the foundation for all data science work.',
        [{ title: 'Python.org Tutorial', url: 'https://docs.python.org/3/tutorial/' }]);
    addNode('ds_py_syntax', 'Syntax & Basics', 'ds_py', 'task', [], 'Variables, data types, control flow, loops');
    addNode('ds_py_oop', 'OOP in Python', 'ds_py', 'task', [], 'Classes, inheritance, polymorphism');
    addNode('ds_py_ds', 'Data Structures', 'ds_py', 'task', [], 'Lists, dicts, sets, tuples, comprehensions');
    addNode('ds_py_func', 'Functions & Modules', 'ds_py', 'task', [], 'Decorators, generators, packaging');

    // Mathematics
    addNode('ds_math', 'Mathematics', dsRoot, 'skill', ['ds_math_la', 'ds_math_calc', 'ds_math_stats', 'ds_math_prob'],
        'The mathematical foundations that power ML algorithms.');
    addNode('ds_math_la', 'Linear Algebra', 'ds_math', 'task', [], 'Vectors, matrices, eigenvalues, SVD',
        [{ title: '3Blue1Brown Series', url: 'https://www.3blue1brown.com/topics/linear-algebra' }]);
    addNode('ds_math_calc', 'Calculus', 'ds_math', 'task', [], 'Derivatives, gradients, chain rule, optimization');
    addNode('ds_math_stats', 'Statistics', 'ds_math', 'task', [], 'Distributions, hypothesis testing, confidence intervals');
    addNode('ds_math_prob', 'Probability', 'ds_math', 'task', [], 'Bayes theorem, conditional probability, random variables');

    // Data Analysis Libraries
    addNode('ds_libs', 'Data Analysis Libraries', dsRoot, 'skill', ['ds_libs_np', 'ds_libs_pd', 'ds_libs_mpl', 'ds_libs_sb'],
        'Core Python libraries for data manipulation and visualization.');
    addNode('ds_libs_np', 'NumPy', 'ds_libs', 'task', [], 'N-dimensional arrays, broadcasting, vectorized operations',
        [{ title: 'NumPy Docs', url: 'https://numpy.org/doc/stable/' }]);
    addNode('ds_libs_pd', 'Pandas', 'ds_libs', 'task', [], 'DataFrames, merging, groupby, time series',
        [{ title: 'Pandas Docs', url: 'https://pandas.pydata.org/docs/' }]);
    addNode('ds_libs_mpl', 'Matplotlib', 'ds_libs', 'task', [], 'Plots, subplots, customization');
    addNode('ds_libs_sb', 'Seaborn', 'ds_libs', 'task', [], 'Statistical visualizations, heatmaps, pair plots');

    // Machine Learning
    addNode('ds_ml', 'Machine Learning', dsRoot, 'skill', ['ds_ml_sup', 'ds_ml_unsup', 'ds_ml_eval', 'ds_ml_feat'],
        'Classical ML algorithms and techniques.',
        [{ title: 'Scikit-learn Docs', url: 'https://scikit-learn.org/stable/' }]);
    addNode('ds_ml_sup', 'Supervised Learning', 'ds_ml', 'skill', ['ds_ml_lr', 'ds_ml_dt', 'ds_ml_rf', 'ds_ml_svm', 'ds_ml_knn'],
        'Algorithms that learn from labeled data.');
    addNode('ds_ml_lr', 'Linear / Logistic Regression', 'ds_ml_sup', 'task');
    addNode('ds_ml_dt', 'Decision Trees', 'ds_ml_sup', 'task');
    addNode('ds_ml_rf', 'Random Forests', 'ds_ml_sup', 'task');
    addNode('ds_ml_svm', 'Support Vector Machines', 'ds_ml_sup', 'task');
    addNode('ds_ml_knn', 'K-Nearest Neighbors', 'ds_ml_sup', 'task');

    addNode('ds_ml_unsup', 'Unsupervised Learning', 'ds_ml', 'skill', ['ds_ml_km', 'ds_ml_pca', 'ds_ml_dbscan'],
        'Algorithms for finding patterns in unlabeled data.');
    addNode('ds_ml_km', 'K-Means Clustering', 'ds_ml_unsup', 'task');
    addNode('ds_ml_pca', 'PCA / Dimensionality Reduction', 'ds_ml_unsup', 'task');
    addNode('ds_ml_dbscan', 'DBSCAN', 'ds_ml_unsup', 'task');

    addNode('ds_ml_eval', 'Model Evaluation', 'ds_ml', 'task', [], 'Cross-validation, confusion matrix, ROC/AUC, precision/recall');
    addNode('ds_ml_feat', 'Feature Engineering', 'ds_ml', 'task', [], 'Encoding, scaling, selection, creation of features');

    // Deep Learning
    addNode('ds_dl', 'Deep Learning', dsRoot, 'skill', ['ds_dl_nn', 'ds_dl_cnn', 'ds_dl_rnn', 'ds_dl_tf', 'ds_dl_pt'],
        'Neural networks and deep learning frameworks.');
    addNode('ds_dl_nn', 'Neural Network Fundamentals', 'ds_dl', 'task', [], 'Perceptrons, activation functions, backpropagation');
    addNode('ds_dl_cnn', 'CNNs (Computer Vision)', 'ds_dl', 'task', [], 'Convolutions, pooling, image classification');
    addNode('ds_dl_rnn', 'RNNs & LSTMs', 'ds_dl', 'task', [], 'Sequence models, text processing, time series');
    addNode('ds_dl_tf', 'TensorFlow / Keras', 'ds_dl', 'task', [], '',
        [{ title: 'TensorFlow Tutorials', url: 'https://www.tensorflow.org/tutorials' }]);
    addNode('ds_dl_pt', 'PyTorch', 'ds_dl', 'task', [], '',
        [{ title: 'PyTorch Tutorials', url: 'https://pytorch.org/tutorials/' }]);

    // NLP
    addNode('ds_nlp', 'Natural Language Processing', dsRoot, 'skill', ['ds_nlp_basics', 'ds_nlp_embed', 'ds_nlp_trans', 'ds_nlp_llm'],
        'Processing and understanding human language.');
    addNode('ds_nlp_basics', 'Text Preprocessing', 'ds_nlp', 'task', [], 'Tokenization, stemming, lemmatization, TF-IDF');
    addNode('ds_nlp_embed', 'Word Embeddings', 'ds_nlp', 'task', [], 'Word2Vec, GloVe, FastText');
    addNode('ds_nlp_trans', 'Transformers & Attention', 'ds_nlp', 'task', [], 'Self-attention, BERT, GPT architecture',
        [{ title: 'Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762' }]);
    addNode('ds_nlp_llm', 'Large Language Models', 'ds_nlp', 'task', [], 'Fine-tuning, prompt engineering, RAG, LangChain');

    // MLOps
    addNode('ds_mlops', 'MLOps & Deployment', dsRoot, 'skill', ['ds_mlops_git', 'ds_mlops_docker', 'ds_mlops_api', 'ds_mlops_pipe'],
        'Productionizing ML models.');
    addNode('ds_mlops_git', 'Version Control (Git)', 'ds_mlops', 'task');
    addNode('ds_mlops_docker', 'Docker & Containers', 'ds_mlops', 'task');
    addNode('ds_mlops_api', 'Model Serving (Flask/FastAPI)', 'ds_mlops', 'task');
    addNode('ds_mlops_pipe', 'ML Pipelines (MLflow)', 'ds_mlops', 'task');

    addNode(dsRoot, '🤖 Data Science & AI/ML', null, 'goal',
        ['ds_py', 'ds_math', 'ds_libs', 'ds_ml', 'ds_dl', 'ds_nlp', 'ds_mlops'],
        'Complete roadmap covering Python, Mathematics, ML, Deep Learning, NLP, and MLOps.');

    // =====================
    // ROADMAP 2: Life & Fitness Goals
    // =====================
    const lifeRoot = 'life_root';
    rootIds.push(lifeRoot);

    // Daily Fitness
    addNode('life_fitness', 'Daily Fitness', lifeRoot, 'skill', ['life_run', 'life_gym', 'life_stretch', 'life_walk'],
        'Stay consistent with physical fitness every day.');
    addNode('life_run', '🏃 Run Every Day', 'life_fitness', 'task', [], 'Daily running habit — start with 2km, build up.');
    addNode('life_gym', '🏋️ Gym Every Day', 'life_fitness', 'task', [], 'Consistent gym sessions — push/pull/legs split.');
    addNode('life_stretch', '🧘 Morning Stretching', 'life_fitness', 'task', [], '10-minute stretching routine each morning.');
    addNode('life_walk', '🚶 10K Steps Daily', 'life_fitness', 'task', [], 'Walk at least 10,000 steps every day.');

    // Health & Wellness
    addNode('life_health', 'Health & Wellness', lifeRoot, 'skill', ['life_sleep', 'life_water', 'life_diet', 'life_mental'],
        'Take care of body and mind.');
    addNode('life_sleep', '😴 Sleep Schedule (11pm–6am)', 'life_health', 'task', [], 'Consistent sleep and wake times.');
    addNode('life_water', '💧 Drink 3L Water Daily', 'life_health', 'task');
    addNode('life_diet', '🥗 Clean Eating', 'life_health', 'task', [], 'High protein, whole foods, minimal junk.');
    addNode('life_mental', '🧠 Mental Wellness', 'life_health', 'task', [], 'Meditation, journaling, screen breaks.');

    // College & Academics
    addNode('life_college', 'College & Academics', lifeRoot, 'skill', ['life_assign', 'life_study', 'life_projects', 'life_exams'],
        'Stay on top of college work and deadlines.');
    addNode('life_assign', '📝 Assignments', 'life_college', 'skill', ['life_assign_add'],
        'Track all your college assignments here.\nAdd new assignments as sub-items!');
    addNode('life_assign_add', '(Add your assignments here)', 'life_assign', 'task', [], 'Click the + button to add your assignments as sub-tasks.');
    addNode('life_study', '📚 Daily Study (2+ hours)', 'life_college', 'task', [], 'Dedicate at least 2 hours to focused study daily.');
    addNode('life_projects', '💻 College Projects', 'life_college', 'skill', [],
        'Add your ongoing projects here.\nTrack progress on each project.');
    addNode('life_exams', '📋 Exam Preparation', 'life_college', 'task', [], 'Start preparing at least 2 weeks before exams.');

    // Personal Growth
    addNode('life_growth', 'Personal Growth', lifeRoot, 'skill', ['life_read', 'life_code', 'life_finance', 'life_social'],
        'Continuous self-improvement.');
    addNode('life_read', '📖 Read 30 mins Daily', 'life_growth', 'task', [], 'Non-fiction, self-improvement, or technical books.');
    addNode('life_code', '💻 Code Every Day', 'life_growth', 'task', [], 'Solve problems, build projects, learn new tech.');
    addNode('life_finance', '💰 Personal Finance', 'life_growth', 'task', [], 'Track expenses, save, learn investing basics.');
    addNode('life_social', '🤝 Social & Networking', 'life_growth', 'task', [], 'Build connections, attend events, collaborate.');

    addNode(lifeRoot, '🌟 Life & Fitness Goals', null, 'goal',
        ['life_fitness', 'life_health', 'life_college', 'life_growth'],
        'Your complete life management roadmap — fitness, health, college, and personal growth.');

    return { nodes, rootIds };
}

// ==========================================
//  SEED DATA — Habits
// ==========================================
function getSeedHabits() {
    const today = getTodayStr();
    return [
        {
            id: generateId(),
            name: 'Morning Run',
            icon: '🏃',
            color: '#10b981',
            completions: [],
            createdAt: new Date().toISOString()
        },
        {
            id: generateId(),
            name: 'Gym Workout',
            icon: '🏋️',
            color: '#3b82f6',
            completions: [],
            createdAt: new Date().toISOString()
        },
        {
            id: generateId(),
            name: 'Study 2+ Hours',
            icon: '📚',
            color: '#8b5cf6',
            completions: [],
            createdAt: new Date().toISOString()
        },
        {
            id: generateId(),
            name: 'Daily Coding',
            icon: '💻',
            color: '#06b6d4',
            completions: [],
            createdAt: new Date().toISOString()
        },
        {
            id: generateId(),
            name: 'Read 30 Minutes',
            icon: '📖',
            color: '#f59e0b',
            completions: [],
            createdAt: new Date().toISOString()
        },
        {
            id: generateId(),
            name: 'Drink 3L Water',
            icon: '💧',
            color: '#06b6d4',
            completions: [],
            createdAt: new Date().toISOString()
        },
        {
            id: generateId(),
            name: 'Sleep by 11 PM',
            icon: '😴',
            color: '#8b5cf6',
            completions: [],
            createdAt: new Date().toISOString()
        }
    ];
}
