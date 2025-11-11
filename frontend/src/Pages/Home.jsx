import Hero from "../components/Hero";
import PlanTrip from "../components/PlanTrip";
import PickCar from "../components/PickCar";
import Faq from "../components/Faq";
import Footer from "../components/Footer";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.7, 
      ease: [0.22, 1, 0.36, 1] // Custom bezier curve mượt hơn
    } 
  },
};

function Home() {
  return (
    <>
      <motion.section
        initial="hidden"
        whileInView="visible"
        variants={fadeUp}
        viewport={{ once: true, amount: 0.3 }}
      >
        <Hero />
      </motion.section>
      <motion.section
        initial="hidden"
        whileInView="visible"
        variants={fadeUp}
        viewport={{ once: true, amount: 0.3 }}
      >
        <PlanTrip />
      </motion.section>
      <motion.section
        initial="hidden"
        whileInView="visible"
        variants={fadeUp}
        viewport={{ once: true, amount: 0.3 }}
      >
        <PickCar />
      </motion.section>
      <motion.section
        initial="hidden"
        whileInView="visible"
        variants={fadeUp}
        viewport={{ once: true, amount: 0.3 }}
      >
        <Faq />
      </motion.section>
      <motion.section
        initial="hidden"
        whileInView="visible"
        variants={fadeUp}
        viewport={{ once: true, amount: 0.2 }}
      >
        <Footer />
      </motion.section>
    </>
  );
}

export default Home;