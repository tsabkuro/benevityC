import { useNavigate } from "react-router-dom";
import CampaignCard from "../components/campaigncard.tsx";
import campaignKits from "../data/campaignkits.json";


function DonorView() {
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

                <h1 className="text-2xl font-bold text-[#1F2937]">Campaigns</h1>
            </header>

            {/* Main content area: keep content centered vertically */}
            <main className="flex-1 px-6 py-10">
                <div className="max-w-5xl mx-auto">
                    <p className="text-[#6B7280] text-sm mb-6">
                        {campaignKits.length} active campaign{campaignKits.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex flex-wrap gap-6 justify-start">
                        {campaignKits.map((campaign) => (
                            <CampaignCard key={campaign.id} campaign={campaign} />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default DonorView;
