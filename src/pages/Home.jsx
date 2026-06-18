import React from 'react';

const Home = () => {
  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Sección Carrusel - RNF2: Rendimiento < 2s */}
      <section className="relative bg-pilas-blue h-[400px] flex items-center justify-center text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">¡Ponte las Pilas!</h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto">
            La plataforma líder en mentoría entre pares con gamificación integrada.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <button className="bg-pilas-gold text-white px-8 py-3 rounded-lg font-bold hover:scale-105 transition-transform shadow-lg">
              Empezar Ahora
            </button>
          </div>
        </div>
        {/* Controles del Carrusel (Simulados) */}
        <button className="absolute left-4 text-white/50 hover:text-white text-4xl">❮</button>
        <button className="absolute right-4 text-white/50 hover:text-white text-4xl">❯</button>
      </section>

      {/* Cuadros Informativos - RF5, RF15 */}
      <section className="max-w-7xl mx-auto py-16 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-sm border-b-4 border-pilas-blue hover:shadow-md transition-shadow text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-pilas-blue mb-2">Busca tu Tutor</h3>
            <p className="text-gray-600">Encuentra expertos en las áreas que necesitas fortalecer rápidamente.</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border-b-4 border-pilas-gold hover:shadow-md transition-shadow text-center">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-pilas-blue mb-2">Gana Insignias</h3>
            <p className="text-gray-600">Gamifica tu aprendizaje. Sube de nivel y desbloquea logros exclusivos.</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border-b-4 border-pilas-blue hover:shadow-md transition-shadow text-center">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-bold text-pilas-blue mb-2">Comunidad</h3>
            <p className="text-gray-600">Conecta con pares y comparte conocimiento de forma segura y eficiente.</p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;