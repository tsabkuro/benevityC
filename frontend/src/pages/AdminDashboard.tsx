import { useNavigate } from "react-router-dom";

function AdminDashboard() {
    const navigate = useNavigate();

    return (
        <div className="h-screen w-screen bg-gradient-to-b from-white to-white flex flex-col">
            {/* Full-width top header: buttons left, title right */}
            <header className="w-full px-6 py-4 flex items-center justify-between">
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate("/")}
                        className="px-4 py-2 bg-[#6C3AED] text-#6B7280 hover:bg-[#5a2ed1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6C3AED]"
                    >
                        Switch Role
                    </button>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            navigate("/");
                        }}
                        className="px-4 py-2 bg-[#E8503A] text-#6B7280 hover:bg-[#cf432f] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8503A]"
                    >
                        Logout
                    </button>
                </div>

                <h1 className="text-3xl font-bold text-[#1F2937]">Admin</h1>
            </header>

            {/* Main content area: keep content centered vertically */}
            <main className="flex-1 flex items-center">
                <div className="max-w-4xl mx-auto px-6 w-full">
                    {/* Stub Content */}
                    <div className="bg-white p-12 rounded-2xl shadow-lg text-center mx-auto max-w-2xl">
                        <h2 className="text-2xl font-semibold text-[#1F2937] mb-4">
                            Campaign Management (Coming Soon)
                        </h2>
                        <p className="text-[#6B7280] mb-8 max-w-md mx-auto">
                            Event discovery, campaign generation, and admin workflow features will appear here.
                        </p>
                        <div className="space-y-3 text-sm text-[#6B7280]">
                            <div><span className="text-[#16A34A]">✅</span> Generate campaigns from disasters</div>
                            <div><span className="text-[#16A34A]">✅</span> Review & approve drafts</div>
                            <div><span className="text-[#16A34A]">✅</span> Manage nonprofits</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default AdminDashboard;
