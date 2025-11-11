export function EventInfoCard({ item }) {
  const Icon = item.icon;
  return (
    <div className="group relative">
      <div
        className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 p-8 border border-gray-100 hover:border-gray-200 hover:-translate-y-2"
        aria-label={item.title}
      >
        <div
          className={`bg-gradient-to-r ${item.gradient} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
        <p className="text-gray-600 leading-relaxed">{item.description}</p>
      </div>
    </div>
  );
}
