import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LogIn() {
    const navigate = useNavigate();
    const [role, setRole] = useState<"admin" | "donor">("admin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Fake login - fields optional
        localStorage.setItem("role", role);
        localStorage.setItem("user", JSON.stringify({ email, role }));

        if (role === "admin") {
            navigate("/admin");
        } else {
            navigate("/campaigns");
        }
    };

    // BEGINNING OF AI GENERATED CODE
    return (
        <div className="h-screen w-screen bg-white flex items-center justify-center p-6">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-10 border min-h-[520px]">
                {/* Benevity Logo */}
                <div className="flex justify-center mb-8">
                    <div className="w-24 h-10 bg-gradient-to-r from-[#6C3AED] to-[#3B82F6] rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">Benevity</span>
                    </div>
                </div>

                <h1 className="text-2xl font-semibold text-[#1F2937] mb-2 text-center">
                    Log in with your Benevity account
                </h1>

                <form onSubmit={handleLogin} className="space-y-6">
                    {/* Role Selector */}
                    <div>
                        <label className="block text-sm font-medium text-[#6B7280] mb-2">
                            Role
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as "admin" | "donor")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3AED] focus:border-[#6C3AED]"
                        >
                            <option value="admin">Admin</option>
                            <option value="donor">Donor</option>
                        </select>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-[#6B7280] mb-2">
                            Email (optional for demo)
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3AED] focus:border-[#6C3AED]"
                            placeholder="john@example.com"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-[#6B7280] mb-2">
                            Password (optional for demo)
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C3AED] focus:border-[#6C3AED] pr-10"
                                placeholder="••••••••"
                                aria-label="Password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-[#6B7280]"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                title={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="w-full bg-[#6C3AED] text-[#6B7280] py-3 px-4 rounded-lg hover:opacity-95 focus:ring-2 focus:ring-[#6C3AED] focus:ring-offset-2 font-medium transition-colors"
                    >
                        Sign in
                    </button>
                </form>
            </div>
        </div>
    );
    // ENDING OF AI GENERATED SLOP
}

export default LogIn;
