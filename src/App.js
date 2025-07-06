import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';

// --- API & Firebase Configuration ---
// IMPORTANT: Step 1 - Replace with your actual Firebase config object
const firebaseConfig = {
  apiKey: "AIzaSyC0j4PJz7JIi7DulAeEGBVrt7YVJpOY0oE",
  authDomain: "moving-planner-app.firebaseapp.com",
  projectId: "moving-planner-app",
  storageBucket: "moving-planner-app.firebasestorage.app",
  messagingSenderId: "37539041968",
  appId: "1:37539041968:web:501ab9096ac04f5bdce175",
  measurementId: "G-N8SWDBBYR8"
};

// IMPORTANT: Step 2 - Replace with your actual Gemini API key
const geminiApiKey = "AIzaSyCPLx3ClKjL2uvtW38Sf6O1MEio47g8uuY";

// --- Initialize Firebase ---
// This check prevents re-initialization and ensures config is valid.
let app;
try {
    app = initializeApp(firebaseConfig);
} catch (e) {
    console.error("Firebase initialization error:", e);
}

const auth = getAuth(app);
const db = getFirestore(app);

// --- Helper Functions ---
const formatDate = (date) => {
    if (!date || !date.seconds) return 'N/A';
    return new Date(date.seconds * 1000).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// --- Components ---

const LoginScreen = ({ setUser }) => {
    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            setUser(result.user);
        } catch (error) {
            console.error("Authentication error:", error);
            alert(`Login Failed: ${error.message}`);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Moving Planner</h1>
                <p className="text-lg text-gray-600 mb-8">Your ultimate tool for a smooth move from SF to NYC.</p>
                <button
                    onClick={signInWithGoogle}
                    className="flex items-center justify-center bg-white border border-gray-300 rounded-lg shadow-md px-6 py-3 text-lg font-medium text-gray-700 hover:bg-gray-100 transition duration-200"
                >
                    <svg className="w-6 h-6 mr-3" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6.04C45.16 39.9 48 32.5 48 24c0-.66-.05-1.32-.15-1.95l-1.02-.5z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6.04c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                    Sign in with Google
                </button>
            </div>
        </div>
    );
};

const TodoList = ({ user }) => {
    const [todos, setTodos] = useState([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "todos"), where("uid", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTodos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [user]);

    const addTodo = async () => {
        if (input.trim() === '') return;
        await addDoc(collection(db, "todos"), {
            text: input,
            completed: false,
            uid: user.uid,
            createdAt: new Date(),
        });
        setInput('');
    };

    const toggleComplete = async (todo) => {
        const todoRef = doc(db, "todos", todo.id);
        await updateDoc(todoRef, { completed: !todo.completed });
    };
    
    const deleteTodo = async (id) => {
        await deleteDoc(doc(db, "todos", id));
    };

    return (
        <div className="p-4">
            <div className="flex gap-2 mb-4">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} className="flex-grow p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., Book moving company" />
                <button onClick={addTodo} className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition">Add</button>
            </div>
            <ul className="space-y-3">
                {todos.sort((a,b) => a.createdAt > b.createdAt ? 1 : -1).map(todo => (
                    <li key={todo.id} className={`flex items-center p-3 rounded-lg transition ${todo.completed ? 'bg-green-100 text-gray-500' : 'bg-white shadow-sm'}`}>
                        <span onClick={() => toggleComplete(todo)} className={`flex-grow cursor-pointer ${todo.completed ? 'line-through' : ''}`}>{todo.text}</span>
                        <button onClick={() => deleteTodo(todo.id)} className="text-red-400 hover:text-red-600 ml-4 font-bold">✕</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const ExpenseTracker = ({ user }) => {
    const [expenses, setExpenses] = useState([]);
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "expenses"), where("uid", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [user]);

    const addExpense = async () => {
        if (name.trim() === '' || amount <= 0) return;
        await addDoc(collection(db, "expenses"), {
            name,
            amount: parseFloat(amount),
            uid: user.uid,
            createdAt: new Date(),
        });
        setName('');
        setAmount('');
    };

    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    return (
        <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="md:col-span-2 p-3 border rounded-lg" placeholder="Expense name" />
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="p-3 border rounded-lg" placeholder="Amount" />
            </div>
            <button onClick={addExpense} className="w-full bg-green-500 text-white p-3 rounded-lg font-semibold hover:bg-green-600 transition mb-4">Add Expense</button>
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center text-xl font-bold mb-3">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                </div>
                <ul className="space-y-2">
                    {expenses.map(expense => (
                        <li key={expense.id} className="flex justify-between p-2 bg-gray-50 rounded-md">
                            <span>{expense.name}</span>
                            <span>${expense.amount.toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const SellItems = ({ user }) => {
    const [items, setItems] = useState([]);
    const [itemName, setItemName] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "items"), where("uid", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [user]);

    const handleFileChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const addItem = async () => {
        if (itemName.trim() === '' || !imageFile) return;
        setLoading(true);
        let fileToUpload = imageFile;
        if (imageFile.type.includes('heic') || imageFile.name.toLowerCase().endsWith('.heic')) {
            try {
                const convertedBlob = await window.heic2any({ blob: imageFile, toType: "image/jpeg" });
                fileToUpload = convertedBlob;
            } catch (e) {
                console.error(e);
                alert("HEIC to JPG conversion failed. Please try another image.");
                setLoading(false);
                return;
            }
        }

        const reader = new FileReader();
        reader.readAsDataURL(fileToUpload);
        reader.onloadend = async () => {
            await addDoc(collection(db, "items"), {
                name: itemName,
                imageUrl: reader.result,
                quantity: 1,
                price: 0,
                uid: user.uid
            });
            setItemName('');
            setImageFile(null);
            document.getElementById('item-image-input').value = '';
            setLoading(false);
        };
    };
    
    const updateItem = async (id, data) => {
        await updateDoc(doc(db, "items", id), data);
    };

    const suggestPrice = async (item) => {
        if (!geminiApiKey || geminiApiKey === "YOUR_GEMINI_API_KEY") {
            alert("Please add your Gemini API key to the code to use this feature.");
            return;
        }
        const prompt = `Based on this image of a "${item.name}", suggest a realistic selling price for Facebook Marketplace in San Francisco. Respond with a JSON object with "price" (number) and "reason" (string).`;
        const base64ImageData = item.imageUrl.split(',')[1];
        const mimeType = item.imageUrl.substring(item.imageUrl.indexOf(':') + 1, item.imageUrl.indexOf(';'));

        const payload = {
            contents: [{
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType, data: base64ImageData } }
                ]
            }]
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        try {
            const result = JSON.parse(data.candidates[0].content.parts[0].text);
            updateItem(item.id, { price: result.price });
        } catch(e) {
            console.error("Failed to parse price suggestion:", e);
        }
    };
    
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div className="p-4">
             <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full p-3 border rounded-lg mb-2" placeholder="Item Name"/>
                <input type="file" id="item-image-input" onChange={handleFileChange} className="w-full p-3 border rounded-lg mb-2" accept="image/*,.heic"/>
                <button onClick={addItem} disabled={loading} className="w-full bg-purple-500 text-white p-3 rounded-lg font-semibold hover:bg-purple-600 transition disabled:bg-purple-300">
                    {loading ? 'Adding...' : 'Add Item'}
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(item => (
                    <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover"/>
                        <div className="p-4">
                            <h3 className="font-bold text-lg">{item.name}</h3>
                            <div className="flex gap-2 my-2">
                                <input type="number" value={item.price} onChange={(e) => updateItem(item.id, {price: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg" placeholder="Price"/>
                                <input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, {quantity: parseInt(e.target.value)})} className="w-1/3 p-2 border rounded-lg" min="1"/>
                            </div>
                            <button onClick={() => suggestPrice(item)} className="w-full text-sm text-blue-500 font-semibold hover:underline">Suggest Price</button>
                            <p className="text-right font-bold mt-2">Subtotal: ${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 text-2xl font-bold text-right">
                Total Estimated Value: <span id="total-value">${totalValue.toFixed(2)}</span>
            </div>
        </div>
    );
};

const ApartmentVisits = ({ user }) => {
    const [visits, setVisits] = useState([]);
    const [address, setAddress] = useState('');
    const [datetime, setDatetime] = useState('');

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "visits"), where("uid", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setVisits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [user]);

    const addVisit = async () => {
        if (address.trim() === '' || datetime === '') return;
        const dateObj = new Date(datetime);
        await addDoc(collection(db, "visits"), {
            address,
            datetime: dateObj,
            uid: user.uid
        });
        setAddress('');
        setDatetime('');
    };
    
    const createGCalLink = (visit) => {
        const startTime = new Date(visit.datetime.seconds * 1000);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Add 1 hour
        const Tformat = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');

        const url = new URL('https://calendar.google.com/calendar/render');
        url.searchParams.append('action', 'TEMPLATE');
        url.searchParams.append('text', `Apartment Viewing: ${visit.address}`);
        url.searchParams.append('dates', `${Tformat(startTime)}/${Tformat(endTime)}`);
        url.searchParams.append('location', visit.address);
        return url.href;
    };

    return (
        <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="p-3 border rounded-lg" placeholder="Apartment Address"/>
                <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} className="p-3 border rounded-lg"/>
            </div>
            <button onClick={addVisit} className="w-full bg-yellow-500 text-black p-3 rounded-lg font-semibold hover:bg-yellow-600 transition mb-4">Add Visit</button>
            <ul className="space-y-3">
                {visits.sort((a,b) => a.datetime.seconds > b.datetime.seconds ? 1 : -1).map(visit => (
                    <li key={visit.id} className="bg-white p-4 rounded-lg shadow-sm">
                        <p className="font-bold">{visit.address}</p>
                        <p className="text-gray-600">{formatDate(visit.datetime)}</p>
                        <div className="flex gap-2 mt-2">
                             <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(visit.address)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 font-semibold hover:underline">View on Map</a>
                             <a href={createGCalLink(visit)} target="_blank" rel="noopener noreferrer" className="text-sm text-green-500 font-semibold hover:underline">Add to Calendar</a>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};


const Dashboard = ({ user }) => {
    // In a real app, you'd fetch this data, but for now we'll mock it.
    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Welcome, {user.displayName}!</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-bold text-lg">Next To-Do</h3>
                    <p>Book moving company</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-bold text-lg">Next Apartment Visit</h3>
                    <p>123 Main St, Brooklyn, NY</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-bold text-lg">Total Expenses</h3>
                    <p className="text-2xl font-bold">$700.50</p>
                </div>
                 <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-bold text-lg">Total Item Value</h3>
                    <p className="text-2xl font-bold">$75.00</p>
                </div>
            </div>
        </div>
    )
}

// --- Main App Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [isConfigValid, setIsConfigValid] = useState(false);

    useEffect(() => {
        // A simple check to see if the config is still the placeholder
        if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("YOUR_")) {
            setIsConfigValid(true);
            const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                setUser(currentUser);
                setLoading(false);
            });
            return () => unsubscribe();
        } else {
            setLoading(false);
        }
    }, []);

    const handleSignOut = async () => {
        await signOut(auth);
        setUser(null);
    };

    if (!isConfigValid) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-red-50 p-4">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg border-2 border-red-500 max-w-lg">
                    <h1 className="text-3xl font-bold text-red-600 mb-4">Configuration Required</h1>
                    <p className="text-lg text-gray-700 mb-2">This application will not work until you provide your own API keys.</p>
                    <p className="text-gray-600">Please open the code and replace the placeholder values for `firebaseConfig` and `geminiApiKey` at the top of the code file.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!user) {
        return <LoginScreen setUser={setUser} />;
    }

    const tabs = ['Dashboard', 'To-Do', 'Expenses', 'For Sale', 'Apartments'];

    const renderContent = () => {
        switch (activeTab) {
            case 'To-Do': return <TodoList user={user} />;
            case 'Expenses': return <ExpenseTracker user={user} />;
            case 'For Sale': return <SellItems user={user} />;
            case 'Apartments': return <ApartmentVisits user={user} />;
            default: return <Dashboard user={user}/>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <header className="bg-white shadow-md">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Moving Planner</h1>
                    <button onClick={handleSignOut} className="text-sm font-medium text-gray-600 hover:text-red-500 transition">Sign Out</button>
                </div>
                <nav className="overflow-x-auto">
                    <div className="container mx-auto px-4 flex border-b">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-3 text-sm font-semibold transition whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </nav>
            </header>
            <main className="container mx-auto p-4">
                {renderContent()}
            </main>
        </div>
    );
}
