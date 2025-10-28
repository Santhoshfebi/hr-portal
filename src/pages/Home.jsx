import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Briefcase, UploadCloud, UserPlus, Quote } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.2, duration: 0.6, ease: "easeOut" },
  }),
};

export default function Home() {
  return (
    <section className="relative flex flex-col items-center justify-center text-center min-h-screen bg-linear-to-b from-blue-50 to-white overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-20"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-10"></div>

      {/* Main content */}
      <div className="z-10 w-full max-w-6xl px-5 sm:px-8 py-20 sm:py-24">
        <motion.h1
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6"
        >
          Streamline Your <span className="text-blue-700">Hiring Process</span>
        </motion.h1>

        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0.5}
          className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Empower your HR team and candidates with{" "}
          <span className="font-semibold text-blue-700">HR Portal</span> — an intuitive,
          secure, and efficient platform to manage applications and resumes effortlessly.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0.8}
          className="flex flex-col sm:flex-row justify-center items-center gap-4"
        >
          <Link
            to="/auth"
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-blue-700 text-white px-8 py-3 rounded-full shadow-md hover:shadow-lg hover:bg-blue-800 transition-all duration-200 font-medium"
          >
            <UserPlus size={20} />
            Get Started
          </Link>
          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 w-full sm:w-auto border border-blue-600 text-blue-700 px-8 py-3 rounded-full hover:bg-blue-700 hover:text-white transition-all duration-200 font-medium"
          >
            <Briefcase size={20} />
            Go to Dashboard
          </Link>
        </motion.div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 text-left">
          {features.map(({ Icon, title, desc }, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i * 0.3}
              className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-7 transition-all duration-300 hover:shadow-2xl hover:shadow-gray-700"
            >
              <Icon className="text-blue-600 mb-4" size={30} />
              <h3 className="font-semibold text-lg text-gray-800 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm sm:text-base leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Trusted Companies with gradient fade & auto-scroll */}
        {/* <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={1}
          className="mt-24 text-center relative"
        >
          <p className="text-xs sm:text-sm uppercase tracking-wider text-gray-500 mb-6">
            Trusted by top companies worldwide
          </p>

          <div className="relative w-full overflow-hidden mt-10 sm:mt-16">
            // Left gradient fade 
            <div className="absolute left-0 top-0 w-20 sm:w-32 h-full bg-linear-to-r from-white to-transparent z-10 pointer-events-none"></div>
            // Right gradient fade 
            <div className="absolute right-0 top-0 w-20 sm:w-32 h-full bg-linear-to-l from-white to-transparent z-10 pointer-events-none"></div>

            <motion.div
              className="flex items-center gap-10 sm:gap-16 w-max"
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                repeat: Infinity,
                duration: 25,
                ease: "linear",
              }}
            >
              {[...companies, ...companies].map((company, i) => (
                <img
                  key={i}
                  src={company.logo}
                  alt={company.name}
                  className="h-8 sm:h-10 md:h-12 transition duration-300"
                />
              ))}
            </motion.div>
          </div>
        </motion.div> */}

        {/* Testimonials */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={1.2}
          className="mt-24 sm:mt-28 text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Users Say
          </h2>
          <p className="text-gray-600 mb-10 sm:mb-12 max-w-xl mx-auto text-sm sm:text-base">
            Hear from recruiters and candidates who use HR Portal to simplify hiring every day.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map(({ name, role, quote, img }, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.4}
                className="bg-white border border-gray-100 shadow-md rounded-2xl p-6 text-left hover:shadow-2xl hover:shadow-gray-700 transition-all duration-300"
              >
                <Quote className="text-blue-600 mb-3" size={22} />
                <p className="text-gray-700 italic mb-5 text-sm sm:text-base leading-relaxed">
                  “{quote}”
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={img}
                    alt={name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{name}</p>
                    <p className="text-gray-500 text-xs">{role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const features = [
  {
    Icon: Briefcase,
    title: "Smart Applications",
    desc: "Submit resumes effortlessly and let HR manage the recruitment flow with ease.",
  },
  {
    Icon: UploadCloud,
    title: "Secure Resume Uploads",
    desc: "Your documents are safely stored and encrypted with Supabase cloud storage.",
  },
  {
    Icon: UserPlus,
    title: "Easy Onboarding",
    desc: "Join our hiring platform in just a few clicks — no complicated setup required.",
  },
];

const companies = [
  { name: "Google", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" },
  { name: "Microsoft", logo: "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg" },
  { name: "Amazon", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" },
  { name: "LinkedIn", logo: "https://upload.wikimedia.org/wikipedia/commons/0/01/LinkedIn_Logo.svg" },
  { name: "Netflix", logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" },
];

const testimonials = [
  {
    name: "Sarah Williams",
    role: "HR Manager, Microsoft",
    quote: "HR Portal has revolutionized how we track candidates. The intuitive dashboard saves us hours every week!",
    img: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    name: "Ravi Patel",
    role: "Software Engineer Candidate",
    quote: "Uploading my resume and tracking my application was super easy. The process was smooth and transparent.",
    img: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Emily Chen",
    role: "Recruiter, Google",
    quote: "Finally, a hiring platform that feels modern! HR Portal makes it effortless to manage applicants at scale.",
    img: "https://randomuser.me/api/portraits/women/65.jpg",
  },
];
