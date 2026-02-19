// import { useEffect, useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'
// import axios from 'axios'
//
// function App() {
//   const [count, setCount] = useState(0)
//   const [status, setStatus] = useState<string>("loading");
//
//   useEffect(() => {
//     axios
//       .get("http://localhost:8001/health")
//       .then((res) => setStatus(res.data.status))
//       .catch(() => setStatus("error"));
//   }, []);
//
//   return (
//     <>
//       <div>
//         <h1>Automated Campaign Kit</h1>
//         <p>Backend status: {status}</p>
//       </div>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.tsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }


function App() {
    return (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 min-h-screen flex items-center justify-center">
            <div className="bg-white p-12 rounded-3xl shadow-2xl">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">✅ Tailwind v4 Works!</h1>
                <p className="text-xl text-gray-600">Blue-to-purple gradient = success</p>
            </div>
        </div>
    );
}

export default App
