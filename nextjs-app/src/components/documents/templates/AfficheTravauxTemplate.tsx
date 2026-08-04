import React from 'react';
import { BEAMO_LEGAL_MENTIONS } from '@/lib/mock-data';
import { DOCUMENT_TYPE_COLORS, type DocumentType } from '@/schemas/document';

interface AfficheTravauxData {
  documentType?: DocumentType;
  title?: string;
  description?: string;
  buildingName?: string;
  buildingAddress?: string;
  supplierName?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  agencyAddress?: string;
  agencyPhone?: string;
}

export const AfficheTravauxTemplate = ({ data }: { data: AfficheTravauxData }) => {
  const coproName = data.buildingName || "Nom de la copropriété";
  const docTitle = data.title || "Type affiche (intervention, rappel)";
  const supplier = data.supplierName || "Nom intervenant";
  const dateIntervention = data.date ? `le ${data.date}` : "Date intervention";
  const horaires = data.startTime && data.endTime ? `de ${data.startTime} à ${data.endTime}` : "";
  const description = data.description || "Texte";

  // Couleur sémantique basée sur le type de document (Eco-Design)
  const documentType = data.documentType || 'general';
  const semanticColor = DOCUMENT_TYPE_COLORS[documentType]?.bg || '#FFC300';

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
          .font-poppins { font-family: 'Poppins', sans-serif; }
        `}
      </style>

      <div
        className="w-full h-full bg-white p-8 flex flex-col gap-5 font-poppins text-black relative"
        style={{ aspectRatio: '210/297' }}
      >
        {/* --- BLOC 1 : HEADER --- */}
        {/* Conteneur jaune étendu jusqu'aux bords et en haut */}
        <div className="-mx-8 -mt-8 px-8 pt-8 pb-6 bg-[#FFC300] shrink-0">
          {/* Header blanc par dessus */}
          <div className="w-full bg-white border-[3px] border-black rounded-[16px] h-20 flex items-center justify-center relative">

            {/* CERCLE LOGO */}
            <div className="absolute left-4 w-14 h-14 bg-[#FFC300] rounded-full flex items-center justify-center z-10 overflow-hidden">
              <img
                src="/images/logo-beamo.png"
                alt="Logo Beamô"
                className="w-12 h-12 object-contain"
              />
            </div>

            {/* Titre Beamô */}
            <h1 className="text-4xl tracking-tighter text-black">Beamô</h1>

            {/* Adresse à droite */}
            <div className="absolute right-4 text-right text-[10px] leading-tight text-black">
              <p>2 Place d&apos;Evreux, BP 110</p>
              <p>27201 Vernon Cedex</p>
              <p>{data.agencyPhone || "02 32 71 23 90"}</p>
            </div>
          </div>
        </div>

        {/* BLOC 2 : CONTEXTE - Couleur sémantique (porteur de l'information type) */}
        <div
          className="w-full border-[3px] border-black rounded-[20px] p-4 text-center shrink-0 flex flex-col justify-center min-h-[100px]"
          style={{ backgroundColor: semanticColor }}
        >
          <h2 className="text-2xl font-extrabold mb-1">{coproName}</h2>
          <p className="text-xl font-bold">{docTitle}</p>
        </div>

        {/* BLOC 3 : GRILLE INFOS (Intervenant + Date) */}
        <div className="grid grid-cols-2 gap-5 shrink-0 h-24">
          {/* Intervenant (Blanc) */}
          <div className="bg-white border-[3px] border-black rounded-[20px] p-4 flex items-center justify-center text-center">
            <span className="text-xl font-bold">{supplier}</span>
          </div>

          {/* Date (BLANC - Eco-Design : économie d'encre) */}
          <div className="bg-white border-[3px] border-black rounded-[20px] p-4 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-extrabold" style={{ color: (semanticColor !== '#FFC300' && semanticColor !== '#FFFFFF') ? semanticColor : '#000' }}>{dateIntervention}</span>
            {horaires && <span className="text-lg font-bold">{horaires}</span>}
          </div>
        </div>

        {/* BLOC 4 : MESSAGE (Flexible) */}
        <div className="w-full bg-white border-[3px] border-black rounded-[20px] flex-1 p-8 relative overflow-hidden">
          <div className="text-2xl font-bold leading-relaxed whitespace-pre-wrap text-black">
            {description}
          </div>

          {data.notes && (
            <div className="mt-8 pt-6 border-t-[3px] border-black">
              <span className="font-bold block mb-2 text-lg">Note importante :</span>
              <p className="text-lg font-medium">{data.notes}</p>
            </div>
          )}
        </div>

        {/* BLOC 5 : FOOTER - Mentions légales */}
        <div className="shrink-0 pt-2 border-t border-gray-200">
          <p className="text-[7px] leading-tight text-gray-600 text-justify">
            {BEAMO_LEGAL_MENTIONS}
          </p>
        </div>
      </div>
    </>
  );
};
