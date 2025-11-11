export function CategoryCard({ category }) {
  return (
    <Link to={`/catalogo?categoria=${encodeURIComponent(category.name)}`} className="group block">
      <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-gray-200 hover:-translate-y-2">
        <div
          className={`w-16 h-16 bg-gradient-to-r ${category.gradient} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center text-2xl`}
          aria-hidden="true"
        >
          {category.icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h3>
        <p className="text-gray-600">{category.count} obras disponibles</p>
        <div className="mt-4 flex items-center text-blue-600 group-hover:text-blue-700">
          <span className="text-sm font-medium">Explorar</span>
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}