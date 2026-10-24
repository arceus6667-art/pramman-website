import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { faqs } from "../data/faqs";
export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const id = useId();
  return (
    <section className="section faq" id="faqs">
      <div className="container faq-grid">
        <div>
          <div className="eyebrow">05 / GOOD QUESTIONS</div>
          <h2>
            Clarity before
            <br />
            <span className="muted">you begin.</span>
          </h2>
          <p>
            Get to know the field
            <br />
            and our proposed learning pathways.
          </p>
        </div>
        <div className="accordion">
          {faqs.map((faq, index) => (
            <article className="faq-item" key={faq.question}>
              <h3>
                <button
                  id={`${id}-question-${index}`}
                  className="faq-trigger"
                  aria-expanded={open === index}
                  aria-controls={`${id}-answer-${index}`}
                  onClick={() => setOpen(open === index ? null : index)}
                >
                  {faq.question}
                  <Plus
                    className={open === index ? "rotate-45" : ""}
                    size={19}
                    aria-hidden="true"
                  />
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {open === index && (
                  <motion.div
                    id={`${id}-answer-${index}`}
                    role="region"
                    aria-labelledby={`${id}-question-${index}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p>{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
