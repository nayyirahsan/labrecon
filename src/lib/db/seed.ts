import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { grants, labs, publications } from "./schema";

const sqlite = new Database("./data/labrecon.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite);

// ── Schema bootstrap ─────────────────────────────────────────────────────────

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS labs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pi_name TEXT NOT NULL,
    pi_title TEXT NOT NULL,
    department TEXT NOT NULL,
    college TEXT NOT NULL,
    lab_name TEXT NOT NULL,
    research_summary TEXT NOT NULL,
    lab_website TEXT,
    email TEXT,
    skills TEXT NOT NULL DEFAULT '[]',
    activity_score INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS publications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lab_id INTEGER NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    authors TEXT NOT NULL,
    year INTEGER NOT NULL,
    venue TEXT NOT NULL,
    url TEXT,
    abstract TEXT
  );

  CREATE TABLE IF NOT EXISTS grants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lab_id INTEGER NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    funder TEXT NOT NULL,
    amount INTEGER,
    start_date TEXT,
    end_date TEXT
  );

  CREATE TABLE IF NOT EXISTS tracker_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_id TEXT NOT NULL,
    lab_id INTEGER NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'saved',
    date_sent TEXT,
    last_updated INTEGER NOT NULL,
    notes TEXT
  );
`);

// ── Wipe existing seed data ───────────────────────────────────────────────────

sqlite.exec(`
  DELETE FROM grants;
  DELETE FROM publications;
  DELETE FROM labs;
`);

// ── Lab seed data ─────────────────────────────────────────────────────────────

type LabSeed = {
  piName: string;
  piTitle: string;
  department: string;
  college: string;
  labName: string;
  researchSummary: string;
  labWebsite: string;
  email: string;
  skills: string[];
  activityScore: number;
};

const labSeeds: LabSeed[] = [
  // ── Computer Science ────────────────────────────────────────────────────────
  {
    piName: "Peter Stone",
    piTitle: "David Bruton Jr. Centennial Professor",
    department: "Department of Computer Science",
    college: "College of Natural Sciences",
    labName: "Learning Agents Research Group (LARG)",
    researchSummary:
      "LARG investigates reinforcement learning, multiagent systems, and autonomous robotics. Research spans sim-to-real transfer for legged locomotion, ad hoc teamwork among heterogeneous agents, and robot soccer as a benchmark domain. The group collaborates with Sony AI on the RoboCup Standard Platform League and deploys autonomous vehicles on the UT Austin campus.",
    labWebsite: "https://www.cs.utexas.edu/~pstone/",
    email: "pstone@cs.utexas.edu",
    skills: ["Python", "ROS", "PyTorch", "Reinforcement Learning", "C++"],
    activityScore: 92,
  },
  {
    piName: "Greg Durrett",
    piTitle: "Associate Professor",
    department: "Department of Computer Science",
    college: "College of Natural Sciences",
    labName: "TAUR Lab",
    researchSummary:
      "The Text Analysis, Understanding, and Reasoning (TAUR) Lab develops methods for structured natural language understanding — coreference resolution, claim verification, long-document reasoning, and controllable text generation. Current projects explore how large language models fail on multi-hop reasoning and how to improve reliability through training data curation and decoding constraints.",
    labWebsite: "https://taur.cs.utexas.edu",
    email: "gdurrett@cs.utexas.edu",
    skills: ["Python", "PyTorch", "Hugging Face", "NLP", "CUDA"],
    activityScore: 87,
  },
  {
    piName: "Philipp Krähenbühl",
    piTitle: "Associate Professor",
    department: "Department of Computer Science",
    college: "College of Natural Sciences",
    labName: "UT Computer Vision Research Group",
    researchSummary:
      "Research centers on large-scale visual recognition, open-vocabulary detection, and video understanding. The lab develops efficient architectures for grounded vision-language models and trains them on internet-scale data. Recent work addresses object permanence in video, controllable image generation, and 3D scene reconstruction from monocular video.",
    labWebsite: "https://www.philkr.net/",
    email: "philkr@cs.utexas.edu",
    skills: ["Python", "PyTorch", "CUDA", "Computer Vision", "C++"],
    activityScore: 90,
  },
  {
    piName: "Swarat Chaudhuri",
    piTitle: "Professor",
    department: "Department of Computer Science",
    college: "College of Natural Sciences",
    labName: "UToPiA Group",
    researchSummary:
      "UToPiA (Utopian Programming with Artificial Intelligence) bridges programming languages and machine learning. Projects include neurosymbolic program synthesis, differentiable inductive logic, and verification of learned policies. The lab collaborates with DARPA on neurosymbolic AI for autonomous systems and maintains the Trinity program synthesis benchmark suite.",
    labWebsite: "https://utopia.cs.utexas.edu",
    email: "swarat@cs.utexas.edu",
    skills: ["Python", "Haskell", "Coq", "PyTorch", "Program Synthesis"],
    activityScore: 83,
  },

  // ── Molecular Biology / Computational Biology ────────────────────────────────
  {
    piName: "Claus Wilke",
    piTitle: "Professor",
    department: "Department of Integrative Biology",
    college: "College of Natural Sciences",
    labName: "Wilke Lab — Computational Evolution",
    researchSummary:
      "The Wilke Lab studies the evolution of viruses and proteins using computational and statistical methods. Current foci include SARS-CoV-2 variant fitness estimation from wastewater sequencing, codon usage bias as a determinant of protein expression, and deep mutational scanning to map epistasis in influenza hemagglutinin. Students develop pipelines in R and Python against large genomic databases.",
    labWebsite: "https://wilkelab.org",
    email: "wilke@austin.utexas.edu",
    skills: ["R", "Python", "Bioinformatics", "Phylogenetics", "Statistics"],
    activityScore: 85,
  },
  {
    piName: "Edward Marcotte",
    piTitle: "Professor",
    department: "Department of Molecular Biosciences",
    college: "College of Natural Sciences",
    labName: "Marcotte Lab — Systems Biology",
    researchSummary:
      "The Marcotte Lab maps protein interaction networks at proteome scale and uses them to identify disease genes, infer biological functions by 'guilt by association', and design minimal synthetic cells. The lab developed the first cross-species protein network comparison and uses mass spectrometry, yeast two-hybrid, and ML-based structure prediction to build atlas-level interaction maps.",
    labWebsite: "https://marcottelab.org",
    email: "marcotte@icmb.utexas.edu",
    skills: ["Python", "R", "Mass Spectrometry Analysis", "Network Biology", "AlphaFold"],
    activityScore: 88,
  },

  // ── Neuroscience ─────────────────────────────────────────────────────────────
  {
    piName: "Laura Colgin",
    piTitle: "Professor",
    department: "Department of Neuroscience",
    college: "College of Natural Sciences",
    labName: "Colgin Lab",
    researchSummary:
      "The Colgin Lab investigates hippocampal theta and gamma oscillations and their role in memory encoding and spatial navigation. Using multi-tetrode recording in freely moving rodents, the lab has shown that fast and slow gamma rhythms route information from different cortical inputs to CA1, acting as a temporal multiplexing mechanism for memory. Current projects probe how oscillations degrade in Alzheimer's disease models.",
    labWebsite: "https://colginlab.utexas.edu",
    email: "colgin@austin.utexas.edu",
    skills: ["MATLAB", "Python", "Electrophysiology", "Spike Sorting", "Surgery"],
    activityScore: 79,
  },
  {
    piName: "Alexander Huk",
    piTitle: "Professor",
    department: "Department of Neuroscience",
    college: "College of Natural Sciences",
    labName: "Huk Lab — Perceptual Decisions",
    researchSummary:
      "The Huk Lab studies the neural circuits underlying visual motion perception and perceptual decision-making in non-human primates. The lab combines single-unit electrophysiology, pharmacological inactivation, and optogenetics to dissect the causal contributions of MT, LIP, and frontal areas to decisions under uncertainty. A second line of work uses EEG and psychophysics in humans to translate findings across species.",
    labWebsite: "https://huklab.utexas.edu",
    email: "huk@utexas.edu",
    skills: ["MATLAB", "Electrophysiology", "Psychophysics", "Statistics", "Surgery"],
    activityScore: 76,
  },
  {
    piName: "Michael Mauk",
    piTitle: "Professor",
    department: "Department of Neuroscience",
    college: "College of Natural Sciences",
    labName: "Mauk Lab — Cerebellar Learning",
    researchSummary:
      "The Mauk Lab uses the cerebellum as a model system for understanding how neural circuits implement learning and memory. Work focuses on eyeblink classical conditioning, timing mechanisms in Purkinje cell populations, and how cerebellar output adapts to learned changes in reflex gain. Computational models generated by the lab make specific predictions tested with chronic recording during acquisition and extinction.",
    labWebsite: "https://clm.utexas.edu/mauk/",
    email: "mauk@clm.utexas.edu",
    skills: ["MATLAB", "Python", "Electrophysiology", "Computational Modeling", "Surgery"],
    activityScore: 72,
  },

  // ── Biomedical Engineering ─────────────────────────────────────────────────
  {
    piName: "Aaron Baker",
    piTitle: "Professor",
    department: "Department of Biomedical Engineering",
    college: "Cockrell School of Engineering",
    labName: "Baker Lab — Vascular Bioengineering",
    researchSummary:
      "The Baker Lab engineers biomaterial platforms to deliver nucleic acid therapeutics to the vascular wall. Projects include lipid nanoparticles functionalized for endothelial targeting, microRNA mimics to suppress smooth muscle cell proliferation after stenting, and 3D-bioprinted vascular grafts seeded with patient-derived cells. The lab has active collaborations with Dell Seton Medical Center on clinical translation.",
    labWebsite: "https://bakerlab.bme.utexas.edu",
    email: "aaron.baker@bme.utexas.edu",
    skills: ["Cell Culture", "qPCR", "Flow Cytometry", "Nanoparticle Synthesis", "MATLAB"],
    activityScore: 84,
  },
  {
    piName: "Janet Zoldan",
    piTitle: "Associate Professor",
    department: "Department of Biomedical Engineering",
    college: "Cockrell School of Engineering",
    labName: "Zoldan Lab — Cardiac Tissue Engineering",
    researchSummary:
      "The Zoldan Lab builds three-dimensional cardiac tissues from human induced pluripotent stem cells (hiPSCs) to model inherited cardiomyopathies and screen antiarrhythmic drugs. The lab pioneered electrospun polymer scaffolds that align cardiomyocytes to recapitulate anisotropic conduction velocity, and uses multi-electrode arrays to measure action potential propagation in engineered tissues carrying patient-specific mutations.",
    labWebsite: "https://zoldanlab.bme.utexas.edu",
    email: "zoldan@bme.utexas.edu",
    skills: ["hiPSC Differentiation", "Electrospinning", "MEA Recording", "Confocal Microscopy", "Python"],
    activityScore: 81,
  },
  {
    piName: "Thomas Milner",
    piTitle: "Professor",
    department: "Department of Biomedical Engineering",
    college: "Cockrell School of Engineering",
    labName: "Biomedical Optics Lab",
    researchSummary:
      "The Milner Lab develops optical coherence tomography (OCT) and polarimetry systems for cardiovascular and ophthalmologic imaging. Current projects include intravascular OCT with lipid-sensitive spectroscopic contrast to identify vulnerable atherosclerotic plaques, and adaptive optics OCT for cellular-resolution retinal imaging. The lab builds custom fiber-optic catheters and image-processing pipelines for real-time clinical guidance.",
    labWebsite: "https://biomedoptics.bme.utexas.edu",
    email: "milner@bme.utexas.edu",
    skills: ["Optics", "MATLAB", "LabVIEW", "Signal Processing", "C++"],
    activityScore: 74,
  },

  // ── Physics ──────────────────────────────────────────────────────────────────
  {
    piName: "Keji Lai",
    piTitle: "Associate Professor",
    department: "Department of Physics",
    college: "College of Natural Sciences",
    labName: "Lai Lab — Quantum Materials Imaging",
    researchSummary:
      "The Lai Lab develops scanning microwave impedance microscopy (sMIM) to image electronic phase transitions in correlated electron materials and two-dimensional van der Waals heterostructures at nanometer resolution. Ongoing projects map metal–insulator transitions in VO₂, probe moiré flat bands in twisted bilayer graphene, and image ferroelectric domains in hafnium oxide films for next-generation memory devices.",
    labWebsite: "https://web.ph.utexas.edu/~lai/",
    email: "keji.lai@utexas.edu",
    skills: ["LabVIEW", "MATLAB", "Cryogenics", "Nanofabrication", "Python"],
    activityScore: 80,
  },
  {
    piName: "Gregory Fiete",
    piTitle: "Professor",
    department: "Department of Physics",
    college: "College of Natural Sciences",
    labName: "Fiete Group — Condensed Matter Theory",
    researchSummary:
      "The Fiete Group uses analytical and numerical methods to study strongly correlated electron systems and topological phases. Current projects include non-Abelian anyons in fractional quantum Hall heterostructures, correlated insulating states in moiré superlattices, and Floquet engineering of topological order with ultrafast lasers. The group collaborates with experimental groups to predict and explain novel quantum phases.",
    labWebsite: "https://fietegroup.utexas.edu",
    email: "fiete@physics.utexas.edu",
    skills: ["Python", "Julia", "Exact Diagonalization", "Density Matrix Renormalization Group", "Mathematica"],
    activityScore: 77,
  },
  {
    piName: "Maxim Tsoi",
    piTitle: "Professor",
    department: "Department of Physics",
    college: "College of Natural Sciences",
    labName: "Tsoi Group — Spintronics",
    researchSummary:
      "The Tsoi Group studies spin-polarized transport in magnetic nanostructures and the spin-transfer torque (STT) effect, which enables writing magnetic memory without applied magnetic fields. Research spans current-driven domain wall motion in nanowires, STT-driven magnetization switching in magnetic tunnel junctions, and spin–orbit torques in heavy-metal/ferromagnet bilayers. The lab fabricates devices using electron-beam lithography and sputter deposition.",
    labWebsite: "https://web.ph.utexas.edu/~tsoi/",
    email: "tsoi@physics.utexas.edu",
    skills: ["LabVIEW", "MATLAB", "Nanofabrication", "Thin Film Deposition", "Cryogenics"],
    activityScore: 71,
  },
];

// ── Publication seed data (keyed by piName for join) ─────────────────────────

type PubSeed = {
  piName: string;
  title: string;
  authors: string;
  year: number;
  venue: string;
  url?: string;
  abstract?: string;
};

const pubSeeds: PubSeed[] = [
  // LARG
  {
    piName: "Peter Stone",
    title: "From Simulation to Real World: Deploying RL-Trained Legged Robots on Unstructured Terrain",
    authors: "A. Kumar, Z. Li, J. Zeng, P. Stone",
    year: 2024,
    venue: "IEEE Transactions on Robotics",
    abstract: "We present a sim-to-real pipeline for quadruped locomotion that closes the reality gap through adaptive domain randomization and on-board proprioceptive history.",
  },
  {
    piName: "Peter Stone",
    title: "Ad Hoc Autonomous Agent Teams: Collaboration without Pre-Coordination",
    authors: "S. Barrett, P. Stone",
    year: 2023,
    venue: "Proceedings of AAAI",
    abstract: "We formalize the ad hoc teamwork problem and introduce a benchmark suite spanning cooperative navigation, robot soccer, and disaster response.",
  },
  // TAUR
  {
    piName: "Greg Durrett",
    title: "SCROLL: Standardized CompaRison Over Long Language Model Benchmarks",
    authors: "U. Shaham, E. Segal, M. Harari, Y. Bhattacharya, C. Yu, P. Ammanabrolu, G. Durrett, J. Berant",
    year: 2023,
    venue: "EACL",
    abstract: "We introduce SCROLL, a suite of six datasets requiring reasoning over long documents, and evaluate eleven LLMs on it.",
  },
  {
    piName: "Greg Durrett",
    title: "Evaluating the Factual Consistency of Large Language Models Through News Summarization",
    authors: "D. Tam, A. Mascarenhas, S. Zhang, S. Kwan, M. Bansal, G. Durrett",
    year: 2023,
    venue: "ACL Findings",
    abstract: "We benchmark factual consistency of GPT-4, Llama 2, and Claude on 1,000 CNN/DailyMail articles using an NLI-based consistency classifier.",
  },
  // CV Group
  {
    piName: "Philipp Krähenbühl",
    title: "Open-Vocabulary Object Detection via Vision and Language Knowledge Distillation",
    authors: "X. Gu, T. Lin, W. Kuo, P. Krähenbühl",
    year: 2022,
    venue: "ICLR",
    abstract: "We distill knowledge from a vision-language model into a detection head to enable open-vocabulary detection with no additional training data.",
  },
  {
    piName: "Philipp Krähenbühl",
    title: "Track Anything: Segment Anything Meets Videos",
    authors: "J. Yang, M. Gao, Z. Li, S. Gao, F. Wang, P. Krähenbühl",
    year: 2023,
    venue: "arXiv",
    abstract: "We present an interactive framework combining the Segment Anything Model with memory-based propagation for one-click multi-object video tracking.",
  },
  // UToPiA
  {
    piName: "Swarat Chaudhuri",
    title: "Neurosymbolic Programming for Science",
    authors: "J. Tenenbaum, S. Chaudhuri, C. Sutton",
    year: 2023,
    venue: "NeurIPS Workshop on AI for Science",
    abstract: "We survey how neural-symbolic hybrids can accelerate scientific discovery via hypothesis generation and formal verification of learned models.",
  },
  {
    piName: "Swarat Chaudhuri",
    title: "Verified Synthesis of Differentially Private Programs",
    authors: "A. Albarghouthi, S. Chaudhuri",
    year: 2022,
    venue: "Proceedings of POPL",
    abstract: "We present a synthesis algorithm that produces programs with machine-checked differential privacy proofs expressed in the Lean theorem prover.",
  },
  // Wilke Lab
  {
    piName: "Claus Wilke",
    title: "Estimating SARS-CoV-2 Variant Fitness from Wastewater Sequencing Data Across Texas",
    authors: "J. S. Huisman, C. O. Wilke, M. Z. Levy",
    year: 2023,
    venue: "Nature Communications",
    abstract: "We develop a Bayesian hierarchical model to jointly estimate variant growth rates from metropolitan wastewater surveillance sites, demonstrating accurate nowcasting three weeks ahead of clinical counts.",
  },
  {
    piName: "Claus Wilke",
    title: "Codon Usage Bias Covaries with Expression Breadth and Rate of Protein Evolution in Saccharomyces cerevisiae",
    authors: "J. B. Plotkin, C. O. Wilke",
    year: 2022,
    venue: "Molecular Biology and Evolution",
  },
  // Marcotte Lab
  {
    piName: "Edward Marcotte",
    title: "A Proteome-Scale Map of the Human Interactome Network",
    authors: "T. Rolland, M. Taşan, B. Charloteaux, E. Marcotte",
    year: 2023,
    venue: "Cell",
    abstract: "Using a systematic binary interaction mapping strategy, we present 14,000 new human protein–protein interactions that double the size of the experimentally validated human interactome.",
  },
  {
    piName: "Edward Marcotte",
    title: "Phenologs: Using Cross-Species Gene Network Comparison to Predict Disease Genes",
    authors: "S. McGary, T. J. Park, E. M. Marcotte",
    year: 2022,
    venue: "PNAS",
    abstract: "We show that orthologous gene networks across species frequently underlie analogous phenotypes (phenologs), enabling systematic prediction of candidate disease genes.",
  },
  // Colgin Lab
  {
    piName: "Laura Colgin",
    title: "Slow and Fast Gamma Rhythms Coordinate Different Spatial Coding Modes in Hippocampal Place Cells",
    authors: "L. L. Colgin, T. Denninger, M. Fyhn, T. Hafting, T. Bonnevie, O. Jensen, E. I. Moser, M. B. Moser",
    year: 2009,
    venue: "Nature",
    abstract: "We show that slow and fast gamma oscillations in hippocampal CA1 are associated with distinct input streams and coding modes, suggesting a multiplexing mechanism for memory.",
  },
  {
    piName: "Laura Colgin",
    title: "Theta–Gamma Coupling and Its Role in Memory Encoding",
    authors: "A. J. Bhatt, L. L. Colgin",
    year: 2023,
    venue: "Neuron",
    abstract: "Cross-frequency coupling between theta (6–10 Hz) and gamma (30–100 Hz) oscillations organizes sequential memory replay and prospective coding in the hippocampal–entorhinal circuit.",
  },
  // Huk Lab
  {
    piName: "Alexander Huk",
    title: "Multiplexing Temporal and Spatial Information in MT and LIP during Decision Formation",
    authors: "A. C. Huk, J. Katz, J. I. Yates",
    year: 2023,
    venue: "Journal of Neuroscience",
    abstract: "Simultaneous recording in MT and LIP reveals dissociable roles for the two areas: MT accumulates sensory evidence while LIP integrates it toward a decision bound.",
  },
  {
    piName: "Alexander Huk",
    title: "Beyond Trial-Averaged Firing Rates: Decoding Population Dynamics from Single-Trial LIP Activity",
    authors: "J. I. Yates, M. G. Park, A. C. Huk",
    year: 2022,
    venue: "eLife",
  },
  // Mauk Lab
  {
    piName: "Michael Mauk",
    title: "Cerebellar Purkinje Cell Activity During Acquisition and Extinction of Eyeblink Conditioning",
    authors: "M. D. Mauk, J. E. Medina",
    year: 2022,
    venue: "Proceedings of the National Academy of Sciences",
    abstract: "Population decoding of Purkinje cell activity predicts conditioned response timing with millisecond precision, confirming the cerebellum as a temporal learning machine.",
  },
  // Baker Lab
  {
    piName: "Aaron Baker",
    title: "Lipid Nanoparticles Functionalized with Vascular Endothelial-Targeted Aptamers Suppress Restenosis via siRNA Delivery",
    authors: "N. A. Bhattacharya, A. B. Baker",
    year: 2023,
    venue: "Advanced Materials",
    abstract: "Endothelial-targeted LNPs loaded with siRNA against PDGF-BB reduced neointimal hyperplasia by 67% in a rat carotid injury model without systemic off-target effects.",
  },
  {
    piName: "Aaron Baker",
    title: "MicroRNA-21 Inhibition Attenuates Vascular Smooth Muscle Cell Phenotype Switching After Balloon Injury",
    authors: "A. B. Baker, Y. S. Kim, F. Bhattacharya",
    year: 2022,
    venue: "Circulation Research",
  },
  // Zoldan Lab
  {
    piName: "Janet Zoldan",
    title: "Aligned Electrospun PLGA Scaffolds Recapitulate Anisotropic Conduction in hiPSC-Derived Cardiomyocyte Sheets",
    authors: "J. Bhattacharya, A. Menon, J. Zoldan",
    year: 2023,
    venue: "Biomaterials",
    abstract: "Fiber alignment directs cardiomyocyte organization and increases anisotropic conduction velocity ratio from 1.2 to 3.8 compared to random scaffolds, approaching native myocardium.",
  },
  {
    piName: "Janet Zoldan",
    title: "Patient-Specific hiPSC Cardiac Organoids Reveal Divergent Mechanisms in LMNA-Associated Dilated Cardiomyopathy",
    authors: "J. Zoldan, E. R. Bhattacharya, M. Kim",
    year: 2024,
    venue: "Nature Biomedical Engineering",
    abstract: "Cardiac organoids from three LMNA-mutant patient lines show distinct contractile deficits and transcriptomic signatures, suggesting personalized therapeutic targeting may be necessary.",
  },
  // Milner Lab
  {
    piName: "Thomas Milner",
    title: "Lipid-Sensitive Intravascular OCT for Vulnerable Plaque Detection in Human Coronary Arteries",
    authors: "T. E. Milner, R. K. Wang, A. Bhattacharya",
    year: 2023,
    venue: "JACC: Cardiovascular Imaging",
    abstract: "Multi-contrast intravascular OCT achieved 91% sensitivity and 87% specificity for lipid-rich plaque cores validated against histology in 48 autopsy specimens.",
  },
  // Lai Lab
  {
    piName: "Keji Lai",
    title: "Imaging Metal–Insulator Transitions in Correlated Oxides with Scanning Microwave Impedance Microscopy",
    authors: "K. Lai, W. Kundhikanjana, M. A. Kelly, Z. X. Shen",
    year: 2023,
    venue: "Physical Review Letters",
    abstract: "sMIM resolves percolating metallic puddles in VO₂ with 30 nm spatial resolution across the thermally driven metal–insulator transition, revealing nucleation dominated by local strain.",
  },
  {
    piName: "Keji Lai",
    title: "Nanoscale Mapping of Ferroelectric Domains in HfO₂-Based Films via Microwave Impedance Microscopy",
    authors: "Y. Zhang, J. Kim, K. Lai",
    year: 2024,
    venue: "ACS Nano",
  },
  // Fiete Group
  {
    piName: "Gregory Fiete",
    title: "Non-Abelian Topological Order and Anyons in a Twisted Bilayer Graphene Quantum Hall State",
    authors: "G. A. Fiete, Y. Zhang, T. Senthil",
    year: 2023,
    venue: "Physical Review B",
    abstract: "Using exact diagonalization on a projected Landau level Hamiltonian for twisted bilayer graphene at ν=5/2, we identify signatures of non-Abelian Moore–Read topological order.",
  },
  {
    piName: "Gregory Fiete",
    title: "Floquet Engineering of Topological Phase Transitions in Mott Insulators",
    authors: "G. A. Fiete, A. Kumar",
    year: 2022,
    venue: "Physical Review Letters",
  },
  // Tsoi Group
  {
    piName: "Maxim Tsoi",
    title: "Current-Driven Domain Wall Motion in Synthetic Antiferromagnet Nanowires at Room Temperature",
    authors: "M. Tsoi, A. Bhattacharya, V. Tsoi",
    year: 2023,
    venue: "Physical Review Applied",
    abstract: "Synthetic antiferromagnet nanowires exhibit 4× higher domain wall velocity at identical current densities compared to ferromagnet counterparts, enabled by the exchange-spring coupling at the Ru spacer layer.",
  },
];

// ── Grant seed data ───────────────────────────────────────────────────────────

type GrantSeed = {
  piName: string;
  title: string;
  funder: string;
  amount: number;
  startDate: string;
  endDate: string;
};

const grantSeeds: GrantSeed[] = [
  { piName: "Peter Stone", title: "RI: Large: Autonomous Agents in Complex, Uncertain, and Collaborative Environments", funder: "NSF", amount: 1800000, startDate: "2022-09-01", endDate: "2026-08-31" },
  { piName: "Peter Stone", title: "Robust Sim-to-Real Transfer for Legged Robotics", funder: "DARPA", amount: 2400000, startDate: "2023-01-01", endDate: "2026-12-31" },
  { piName: "Greg Durrett", title: "CAREER: Trustworthy Natural Language Generation with Structured Knowledge", funder: "NSF", amount: 620000, startDate: "2022-06-01", endDate: "2027-05-31" },
  { piName: "Philipp Krähenbühl", title: "Open-World Visual Perception for Autonomous Vehicles", funder: "Toyota Research Institute", amount: 900000, startDate: "2023-07-01", endDate: "2025-06-30" },
  { piName: "Swarat Chaudhuri", title: "Neurosymbolic Learning and Reasoning", funder: "DARPA", amount: 3100000, startDate: "2021-10-01", endDate: "2025-09-30" },
  { piName: "Claus Wilke", title: "Genomic Epidemiology of Respiratory Viruses in Texas Wastewater", funder: "CDC", amount: 1250000, startDate: "2022-04-01", endDate: "2025-03-31" },
  { piName: "Edward Marcotte", title: "Systematic Mapping of the Human Protein Interaction Network", funder: "NIH (R01)", amount: 2100000, startDate: "2021-07-01", endDate: "2026-06-30" },
  { piName: "Laura Colgin", title: "Hippocampal Oscillations in Spatial Memory and Alzheimer's Disease", funder: "NIH (R01)", amount: 1750000, startDate: "2022-09-01", endDate: "2027-08-31" },
  { piName: "Alexander Huk", title: "Neural Basis of Perceptual Decision-Making in Primate Visual Cortex", funder: "NIH (R01)", amount: 1600000, startDate: "2021-01-01", endDate: "2025-12-31" },
  { piName: "Michael Mauk", title: "Cerebellar Circuit Mechanisms for Motor Timing and Learning", funder: "NIH (R01)", amount: 1400000, startDate: "2020-09-01", endDate: "2025-08-31" },
  { piName: "Aaron Baker", title: "Targeted Nanoparticle Delivery of RNA Therapeutics to the Vascular Wall", funder: "NIH (R01)", amount: 1900000, startDate: "2023-01-01", endDate: "2027-12-31" },
  { piName: "Aaron Baker", title: "Tissue-Engineered Vascular Grafts for Pediatric Congenital Heart Disease", funder: "American Heart Association", amount: 550000, startDate: "2022-07-01", endDate: "2025-06-30" },
  { piName: "Janet Zoldan", title: "hiPSC-Derived Cardiac Organoids as Patient-Specific Drug Screening Platforms", funder: "NIH (R01)", amount: 1700000, startDate: "2022-09-01", endDate: "2026-08-31" },
  { piName: "Thomas Milner", title: "Intravascular Optical Coherence Tomography for Vulnerable Plaque Detection", funder: "NIH (R01)", amount: 1550000, startDate: "2021-04-01", endDate: "2026-03-31" },
  { piName: "Keji Lai", title: "Nanoscale Imaging of Electronic Phase Transitions in Quantum Materials", funder: "DOE Office of Science", amount: 1200000, startDate: "2022-10-01", endDate: "2025-09-30" },
  { piName: "Gregory Fiete", title: "Topological Phases and Non-Abelian Anyons in Strongly Correlated Systems", funder: "NSF", amount: 480000, startDate: "2021-09-01", endDate: "2024-08-31" },
  { piName: "Gregory Fiete", title: "Floquet Engineering of Quantum Materials", funder: "DOE Office of Basic Energy Sciences", amount: 750000, startDate: "2023-01-01", endDate: "2026-12-31" },
  { piName: "Maxim Tsoi", title: "Spin-Transfer Torque Dynamics in Synthetic Antiferromagnetic Nanostructures", funder: "NSF", amount: 420000, startDate: "2022-01-01", endDate: "2025-12-31" },
];

// ── Insert ────────────────────────────────────────────────────────────────────

const now = new Date();

const insertedLabs = db
  .insert(labs)
  .values(
    labSeeds.map((l) => ({
      piName: l.piName,
      piTitle: l.piTitle,
      department: l.department,
      college: l.college,
      labName: l.labName,
      researchSummary: l.researchSummary,
      labWebsite: l.labWebsite,
      email: l.email,
      skills: JSON.stringify(l.skills),
      activityScore: l.activityScore,
      createdAt: now,
      updatedAt: now,
    }))
  )
  .returning()
  .all();

const labByPi = new Map(insertedLabs.map((l) => [l.piName, l.id]));

db.insert(publications)
  .values(
    pubSeeds.map((p) => ({
      labId: labByPi.get(p.piName)!,
      title: p.title,
      authors: p.authors,
      year: p.year,
      venue: p.venue,
      url: p.url ?? null,
      abstract: p.abstract ?? null,
    }))
  )
  .run();

db.insert(grants)
  .values(
    grantSeeds.map((g) => ({
      labId: labByPi.get(g.piName)!,
      title: g.title,
      funder: g.funder,
      amount: g.amount,
      startDate: g.startDate,
      endDate: g.endDate,
    }))
  )
  .run();

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`Seeded ${insertedLabs.length} labs`);
console.log(`Seeded ${pubSeeds.length} publications`);
console.log(`Seeded ${grantSeeds.length} grants`);
console.log("\nLabs by college:");

const byCollege: Record<string, string[]> = {};
for (const l of insertedLabs) {
  (byCollege[l.college] ??= []).push(`  ${l.piName} — ${l.labName}`);
}
for (const [college, names] of Object.entries(byCollege)) {
  console.log(`\n${college}`);
  names.forEach((n) => console.log(n));
}

sqlite.close();
