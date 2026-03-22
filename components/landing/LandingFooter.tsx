export function LandingFooter() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                  <path d="M12 2C8.5 2 6 4.5 6 7c0 1.5.5 2.8 1.4 3.8L6 20h2l.8-4h6.4l.8 4h2L16.6 10.8C17.5 9.8 18 8.5 18 7c0-2.5-2.5-5-6-5z"/>
                </svg>
              </div>
              <span className="text-white font-bold">DentalFlow</span>
            </div>
            <p className="text-xs leading-relaxed">
              Software de gestión para clínicas dentales en Perú y LATAM.
            </p>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Producto</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-white transition-colors">Características</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Precios</a></li>
              <li><a href="#how" className="hover:text-white transition-colors">Cómo funciona</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Soporte</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="mailto:soporte@dentalflow.pe" className="hover:text-white transition-colors">soporte@dentalflow.pe</a></li>
              <li><span>Lima, Perú</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">Términos de uso</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <p>© {new Date().getFullYear()} DentalFlow. Todos los derechos reservados.</p>
          <p>Hecho con ❤️ en Lima, Perú</p>
        </div>
      </div>
    </footer>
  );
}
