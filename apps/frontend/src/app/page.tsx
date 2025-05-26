import homeImg from '/public/laptop.jpg';
import Hero from '@/components/hero';

export default function Home() {
  return ( 
    <Hero 
      imgData={homeImg}
      imgAlt="frontpage"
      title="E-commerce project"
      subTitle='Distributed systems'
      description="By Nicolai"
    />
  );
  
}