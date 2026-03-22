export function HowItWorks() {
  const steps = [
    { n: "01", title: "Crea tu cuenta", desc: "Regístrate en minutos. Sin contrato, sin instalación. Accede desde cualquier dispositivo." },
    { n: "02", title: "Agrega tus pacientes", desc: "Importa o crea fichas de pacientes con historial médico, datos de contacto y más." },
    { n: "03", title: "Programa citas", desc: "Usa el calendario visual para agendar citas arrastrando y soltando en los horarios disponibles." },
    { n: "04", title: "Los recordatorios se envían solos", desc: "24 horas antes de cada cita, el sistema envía un WhatsApp o SMS automático al paciente." },
  ];

  return (
    <section id="how" className="py-24 bg-gray-50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">¿Cómo funciona?</h2>
          <p className="text-gray-500 text-lg">Empieza en minutos, no en días.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={step.n} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-5 left-full w-full h-px bg-gray-200 z-0" />
              )}
              <div className="relative z-10 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm h-full">
                <span className="text-3xl font-black text-primary-100">{step.n}</span>
                <h3 className="font-semibold text-gray-900 mt-2 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
