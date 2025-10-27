import { Card, CardContent } from '@/components/ui/card'

export default function OfficeMap() {
  // Lien direct vers la fiche Google My Business de Beamô
  // Place ID: 0x47e6cb7c4ce8bd77:0xc55ae46bcb08f2f1
  // Utilise la fiche GMB pour booster le référencement de Beamô (pas celui de la Manufacture)
  const mapUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d164.82487719288778!2d1.4748482!3d49.0970241!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e6cb7c4ce8bd77%3A0xc55ae46bcb08f2f1!2sBeam%C3%B4!5e0!3m2!1sfr!2sfr!4v1234567890!5m2!1sfr!2sfr'

  return (
    <Card className="border-2 border-black bg-white shadow-xl overflow-hidden">
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Informations */}
          <div className="p-8 bg-white">
            <h3 className="text-2xl font-semibold text-neutral mb-4">Venez nous rencontrer</h3>
            <div className="space-y-4 text-muted-foreground">
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary mt-1 flex-shrink-0"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <div>
                  <p className="font-medium text-neutral">Notre bureau</p>
                  <p>Manufacture des Capucins</p>
                  <p>Place Jean Paul II</p>
                  <p>27200 Vernon</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary mt-1 flex-shrink-0"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <div>
                  <p className="font-medium text-neutral">Horaires</p>
                  <p>Sur rendez-vous uniquement</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary mt-1 flex-shrink-0"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <div>
                  <p className="font-medium text-neutral">Prendre rendez-vous</p>
                  <a href="tel:0775707099" className="text-primary hover:underline font-medium">
                    07 75 70 70 99
                  </a>
                </div>
              </div>

              <div className="mt-6 p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
                <p className="text-sm">
                  <strong>📍 Accueil sur rendez-vous</strong>
                  <br />
                  Contactez-nous par téléphone ou via notre formulaire pour convenir d'un rendez-vous à notre bureau de Vernon.
                </p>
              </div>
            </div>
          </div>

          {/* Carte Google Maps */}
          <div className="relative h-[400px] md:h-full min-h-[400px]">
            <iframe
              src={mapUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localisation du bureau Beamô à Vernon - Manufacture des Capucins"
              className="absolute inset-0"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
