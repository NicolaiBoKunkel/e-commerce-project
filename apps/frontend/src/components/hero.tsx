import type { StaticImageData } from "next/image";
import Image from 'next/image';


interface HeroProps{
    imgData: StaticImageData;
    imgAlt: string;
    title: string;
    subTitle?: string;
    description: string
}

export default function Hero(props: HeroProps){
    return(
        <div className="relative h-screen"> 
            <div className='absolute -z-10 inset-0'>
                <Image 
                    src={props.imgData}
                    alt={props.imgAlt}
                    fill
                    style={{objectFit: 'cover'}}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900"/>
            </div>
            <div className="pt-48 flex justify-center items-center">
                <h1 className="text-white text-6xl">{props.title}</h1>
            </div>
            <div className="pt-12 flex justify-center items-center">
                <h2 className="text-white text-4xl">{props.subTitle}</h2>
            </div>
            <div className="pt-12 flex justify-center ">
                <p className="text-white text-3xl">{props.description}</p>
            </div>
        </div>
    )
}