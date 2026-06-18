import React from 'react';
import logo from '../assets/logo.png';
const Footer = () => {
  return (
    <footer className="bg-pilas-black text-white py-12">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-gray-800 pb-8">
        <div>
          <img className="h-40 w-auto" src={logo} alt="Pilas! Logo" />
          <p className="text-gray-400 text-sm">
            Potenciando el conocimiento a través del aprendizaje colaborativo.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-pilas-gold mb-4">Enlaces Rápidos</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li><a href="#" className="hover:text-white">Sobre Nosotros</a></li>
            <li><a href="#" className="hover:text-white">Términos y Condiciones</a></li>
            <li><a href="#" className="hover:text-white">Soporte</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-pilas-gold mb-4">Contacto</h4>
          <p className="text-gray-400 text-sm">Email: soporte@pilas.edu</p>
          <p className="text-gray-400 text-sm">2026 © MIC - Software Development</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;