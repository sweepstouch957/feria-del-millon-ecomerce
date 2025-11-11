export default function LocalStyles() {
  return (
    <style>{`
      @keyframes float { 0% { transform: translateY(0); opacity: .3; } 50% { transform: translateY(-12px); opacity: .45; } 100% { transform: translateY(0); opacity: .3; } }
      @keyframes fadeInUp { 0% { opacity: 0; transform: translateY(16px); } 100% { opacity: 1; transform: translateY(0); } }
      .particle { animation-name: float; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
      .fade-in-up { animation: fadeInUp .7s ease forwards; opacity: 0; }
      .hero-blob { animation: float 6s ease-in-out infinite; }
      .delay-2000 { animation-delay: 2s; }
      .delay-4000 { animation-delay: 4s; }
    `}</style>
  );
}