import React from 'react';

export const InfoSection: React.FC = () => {
  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4 text-slate-700 dark:text-slate-300 mt-16 mb-24">
      
      {/* Block 1: Grundlagen */}
      <section className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-xl shadow-md border-l-4 border-blue-500 transition-colors">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-10 border-b border-slate-100 dark:border-slate-700 pb-4">Grundlagen der Portfoliotheorie und -analyse</h2>
        
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <div className="mb-10">
              <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">Erwartete Rendite (μ)</h3>
              <p className="text-base leading-8 text-slate-600 dark:text-slate-300">
                Die erwartete Rendite beschreibt, welchen Ertrag ein Wertpapier im Durchschnitt liefern soll. 
                Sie wird häufig aus historischen Daten abgeleitet. <br/>
                <span className="italic font-medium text-slate-800 dark:text-slate-200">Wichtig:</span> Die Vergangenheit ist kein Garant für die Zukunft.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">Risiko / Volatilität (σ)</h3>
              <p className="text-base leading-8 text-slate-600 dark:text-slate-300">
                Das Risiko wird über die Volatilität beschrieben. Sie misst die Schwankungsbreite der Renditen um ihren Mittelwert.
                Je größer diese Schwankungen, desto unsicherer die Geldanlage.
                <br />
                <span className="font-medium text-slate-800 dark:text-slate-200">Hohe Volatilität = Hohe Unsicherheit.</span>
              </p>
            </div>
          </div>
          
          <div>
             <div className="mb-10">
               <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">Korrelation (ρ)</h3>
               <p className="text-base leading-8 text-slate-600 dark:text-slate-300 mb-4">
                 Zeigt, wie ähnlich sich zwei Wertpapiere bewegen:
               </p>
               <ul className="space-y-3 text-base pl-2 border-l-2 border-slate-200 dark:border-slate-600 ml-1 leading-relaxed">
                 <li className="pl-3"><span className="font-bold text-red-500 inline-block w-8 text-right mr-2">+1</span> Identische Bewegung (Keine Diversifikation)</li>
                 <li className="pl-3"><span className="font-bold text-slate-500 dark:text-slate-400 inline-block w-8 text-right mr-2">0</span> Unabhängige Entwicklung</li>
                 <li className="pl-3"><span className="font-bold text-green-500 inline-block w-8 text-right mr-2">-1</span> Gegenläufige Bewegung (Stabilisierung)</li>
               </ul>
             </div>

            <div>
              <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">Sharpe Ratio</h3>
              <p className="text-base leading-8 text-slate-600 dark:text-slate-300">
                Setzt die erwartete Rendite ins Verhältnis zum eingegangenen Risiko. Eine hohe Sharpe Ratio bedeutet, dass das Portfolio für das eingegangene Risiko überdurchschnittlich viel Rendite liefert.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Block 2: Interpretation */}
      <section className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-xl shadow-md border-l-4 border-blue-500 transition-colors">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-10 border-b border-slate-100 dark:border-slate-700 pb-4">Interpretation der Ergebnisse</h2>
        
        <div className="grid md:grid-cols-3 gap-12">
          
          {/* Efficient Frontier */}
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-slate-400 shadow-sm flex-shrink-0"></span>
              Efficient Frontier
            </h3>
            <p className="text-base leading-8 text-slate-600 dark:text-slate-300">
              Die gekrümmte Linie (Effizienzlinie) zeigt die theoretisch besten Kombinationen. Portfolios auf dieser oberen Kante bieten für ein gegebenes Risiko die maximale Rendite. Alles darunter ist ineffizient.
            </p>
          </div>
          
          {/* MinVar */}
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm flex-shrink-0"></span>
              Minimum-Varianz
            </h3>
            <p className="text-base leading-8 text-slate-600 dark:text-slate-300">
              Der rote Punkt ganz links auf der Kurve. Dieses Portfolio minimiert das absolute Schwankungsrisiko mathematisch perfekt, unabhängig von der Rendite. Ideal für Sicherheitsbewusste.
            </p>
          </div>

          {/* MaxSharpe */}
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm flex-shrink-0"></span>
              Maximum-Sharpe
            </h3>
            <p className="text-base leading-8 text-slate-600 dark:text-slate-300">
              Der grüne Punkt (Tangentialportfolio). Hier ist das Verhältnis aus Ertrag pro Risikoeinheit am höchsten. Es ist der mathematische "Sweet Spot" zwischen Risiko und Gewinnchance.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-700 text-center">
           <p className="text-lg font-serif italic text-slate-500 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
             "Die Theorie kann deine Gewichtung optimieren – aber sie sucht dir keine optimalen Aktien. Ein optimiertes Portfolio aus schlechten Aktien bleibt am Ende trotzdem ein Haufen schlechter Aktien."
           </p>
        </div>
      </section>
    </div>
  );
};