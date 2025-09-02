import localFont from 'next/font/local'

export const avenirBlack = localFont({
  src: [
    {
      path: '../../public/fonts/avenir/Avenir Black/Avenir Black.ttf',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-avenir-black',
  display: 'swap',
})

