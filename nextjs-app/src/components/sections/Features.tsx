import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Zap, DollarSign, Award } from 'lucide-react'

export default function Features() {
  return (
    <section id="features" className="section bg-primary">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-3">
          <Feature
            icon={<Zap className="h-7 w-7" />}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            title="Réactivité"
            desc="Nous vous répondons en moins de 48h, et sommes joignables directement par téléphone."
          />
          <Feature
            icon={<DollarSign className="h-7 w-7" />}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            title="Transparence"
            desc="Des honoraires clairs et sans surprise. Vous savez exactement ce que vous payez."
          />
          <Feature
            icon={<Award className="h-7 w-7" />}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
            title="Expertise"
            desc="Une équipe qualifiée et passionnée, à l'écoute de vos besoins spécifiques."
          />
        </div>
      </div>
    </section>
  )
}

function Feature({
  icon,
  iconBgColor,
  iconColor,
  title,
  desc
}: {
  icon: React.ReactNode
  iconBgColor: string
  iconColor: string
  title: string
  desc: string
}) {
  return (
    <Card className="border-2 border-black bg-white p-8 shadow-xl transition-transform hover:-translate-y-1 hover:shadow-2xl">
      <CardHeader className="p-0 pb-4">
        <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${iconBgColor}`}>
          <div className={iconColor}>
            {icon}
          </div>
        </div>
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      </CardHeader>
      <CardContent className="p-0">
        <p className="text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  )
}
