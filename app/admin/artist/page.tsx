export const metadata = {
  title: "Sobre la Semana del Arte 2025 | Feria del Millón",
  description:
    "Conoce la misión, categorías y contacto de la Semana del Arte 2025, 12ª edición de la Feria del Millón.",
};

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <article className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Sobre la Semana del Arte 2025
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              La <strong>Semana del Arte 2025</strong> es la 12ª edición de la
              <strong> Feria del Millón</strong>, la plataforma más importante
              de arte emergente en Colombia. Este evento reúne a los talentos
              más prometedores del panorama artístico nacional, ofreciendo una
              vitrina única para descubrir y adquirir obras de arte
              contemporáneo.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Nuestra Misión
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Promover y democratizar el acceso al arte contemporáneo
              colombiano, conectando artistas emergentes con coleccionistas,
              galerías y amantes del arte. Creemos en el poder transformador del
              arte y su capacidad para generar diálogo, reflexión y cambio
              social.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              ¿Por qué &quot;Feria del Millón&quot;?
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              El nombre refleja nuestro compromiso con hacer el arte accesible.
              Todas las obras en nuestra feria tienen precios que permiten a
              nuevos coleccionistas ingresar al mundo del arte, sin comprometer
              la calidad ni el valor artístico de las piezas.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Categorías Artísticas
            </h2>
            <ul className="text-gray-700 space-y-2 mb-6">
              <li>
                <strong>Dibujantes:</strong> Exploraciones contemporáneas del
                dibujo tradicional
              </li>
              <li>
                <strong>Fotografía:</strong> Narrativas visuales y documentales
              </li>
              <li>
                <strong>Pintura:</strong> Expresiones pictóricas innovadoras
              </li>
              <li>
                <strong>Escultura:</strong> Obras tridimensionales y
                instalaciones
              </li>
              <li>
                <strong>Técnicas Mixtas:</strong> Experimentación con múltiples
                medios
              </li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Contacto
            </h2>
            <div className="bg-gray-50 rounded-lg p-6 not-prose">
              <p className="text-gray-700 mb-2">
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:coordinaciongeneral@feriadelmillon.com"
                  className="text-blue-600 hover:underline"
                >
                  coordinaciongeneral@feriadelmillon.com
                </a>
              </p>
              <p className="text-gray-700">
                <strong>Teléfono:</strong>{" "}
                <a
                  href="tel:+573227008576"
                  className="text-blue-600 hover:underline"
                >
                  +(57) 322 700 85 76
                </a>
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
