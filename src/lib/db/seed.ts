import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { grants, labs, publications } from "./schema";

const sqlite = new Database("./data/labrecon.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = OFF"); // off during seed

const db = drizzle(sqlite);

// ── Schema bootstrap (drop + recreate for clean slate) ────────────────────────

sqlite.exec(`
  DROP TABLE IF EXISTS tracker_entries;
  DROP TABLE IF EXISTS grants;
  DROP TABLE IF EXISTS publications;
  DROP TABLE IF EXISTS labs;

  CREATE TABLE labs (
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

  CREATE TABLE publications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lab_id INTEGER NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    authors TEXT NOT NULL,
    year INTEGER NOT NULL,
    venue TEXT NOT NULL,
    url TEXT,
    abstract TEXT,
    citations INTEGER
  );

  CREATE TABLE grants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lab_id INTEGER NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    funder TEXT NOT NULL,
    amount INTEGER,
    start_date TEXT,
    end_date TEXT
  );

  CREATE TABLE tracker_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_id TEXT NOT NULL,
    lab_id INTEGER NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'saved',
    date_sent TEXT,
    last_updated INTEGER NOT NULL,
    notes TEXT
  );
`);

sqlite.pragma("foreign_keys = ON");

// ── Types ─────────────────────────────────────────────────────────────────────

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

type PubSeed = {
  piName: string;
  title: string;
  authors: string;
  year: number;
  venue: string;
  url?: string;
  abstract?: string;
  citations?: number;
};

type GrantSeed = {
  piName: string;
  title: string;
  funder: string;
  amount: number;
  startDate: string;
  endDate: string;
};

// ── TIER 1: 15 fully detailed labs ───────────────────────────────────────────

const tier1Labs: LabSeed[] = [
  // ── Computer Science / ECE ────────────────────────────────────────────────
  {
    piName: "Atlas Wang",
    piTitle: "Associate Professor",
    department: "Department of Electrical and Computer Engineering",
    college: "Cockrell School of Engineering",
    labName: "VITA Group",
    researchSummary:
      "The Visual Informatics and Technology Advancements (VITA) group develops efficient deep learning systems—covering neural network pruning, quantization, and architecture search for large language models and vision transformers. The group pioneered one-shot pruning methods for GPT-scale models and gradient-efficient LLM fine-tuning via low-rank projection, releasing widely adopted open-source tools for model compression. Current work addresses efficient foundation model deployment on edge hardware and hardware-software co-design for sparse inference.",
    labWebsite: "https://vita-group.github.io",
    email: "atlaswang@utexas.edu",
    skills: ["Python", "PyTorch", "CUDA", "Neural Architecture Search", "Model Compression", "C++"],
    activityScore: 93,
  },
  {
    piName: "Jessy Li",
    piTitle: "Associate Professor",
    department: "Department of Linguistics",
    college: "College of Liberal Arts",
    labName: "Computational Language and Discourse Lab",
    researchSummary:
      "The Computational Language and Discourse Lab studies how humans produce and understand coherent language—developing computational models of discourse structure, argumentation, and information ordering for scientific and news text. The group builds NLP systems that reason across multiple sentences and documents, with applications in automated summarization, scientific claim verification, and low-resource language understanding. Current work investigates whether large language models truly grasp implicit discourse relations and how to make generated text more reliably coherent.",
    labWebsite: "https://jessyli.com",
    email: "jessy@utexas.edu",
    skills: ["Python", "PyTorch", "Hugging Face", "NLP", "Discourse Analysis", "Transformers"],
    activityScore: 87,
  },
  {
    piName: "Scott Niekum",
    piTitle: "Associate Professor",
    department: "Department of Computer Science",
    college: "College of Natural Sciences",
    labName: "Personal Autonomous Robotics Lab (PeARL)",
    researchSummary:
      "The Personal Autonomous Robotics Lab investigates how robots learn from imperfect human teachers—including from a small number of demonstrations, interactive feedback, and ranked preference comparisons. The lab develops Bayesian methods for identifying task structure from unstructured demonstrations, conformal prediction for uncertainty-aware robot decisions, and safe reinforcement learning algorithms with formal guarantees. Applications span household manipulation, assistive robotics, and human-robot collaboration in unstructured environments.",
    labWebsite: "https://www.cs.utexas.edu/~sniekum/",
    email: "sniekum@cs.utexas.edu",
    skills: ["Python", "ROS", "PyTorch", "Robot Learning", "C++", "Imitation Learning"],
    activityScore: 88,
  },
  {
    piName: "David Soloveichik",
    piTitle: "Associate Professor",
    department: "Department of Electrical and Computer Engineering",
    college: "Cockrell School of Engineering",
    labName: "Soloveichik Lab",
    researchSummary:
      "The Soloveichik Lab develops theoretical foundations for molecular programming—designing chemical reaction networks that compute, DNA circuits that implement Boolean logic and signal processing, and programmable nucleic acid systems that sense and respond to their biochemical environment. The lab proved fundamental results on the computational power of chemical kinetics, introduced DNA strand displacement cascades as universal computational substrates, and applies these principles to biosensing and smart therapeutics.",
    labWebsite: "https://users.ece.utexas.edu/~soloveichik/",
    email: "david.soloveichik@utexas.edu",
    skills: ["Python", "Mathematica", "DNA Design", "Stochastic Analysis", "MATLAB", "Molecular Simulation"],
    activityScore: 84,
  },
  {
    piName: "Keshav Pingali",
    piTitle: "W.A. 'Tex' Moncrief Chair in Grid and Distributed Computing",
    department: "Department of Computer Science",
    college: "College of Natural Sciences",
    labName: "Intelligent Software Systems Lab (ISSL)",
    researchSummary:
      "The Intelligent Software Systems Lab develops programming models, compilers, and runtime systems for irregular parallel computations—including graph analytics, sparse linear algebra, and machine learning workloads that lack the regular structure of dense matrix operations. The lab created the Galois system and the operator formulation of parallelism, which identifies exploitable concurrency in algorithms like breadth-first search, belief propagation, and triangle counting. The Lonestar and Katana frameworks are used in industry-scale graph analytics.",
    labWebsite: "https://www.cs.utexas.edu/~pingali/",
    email: "pingali@cs.utexas.edu",
    skills: ["C++", "Python", "CUDA", "Graph Analytics", "Compilers", "Parallel Computing"],
    activityScore: 85,
  },

  // ── Psychology ────────────────────────────────────────────────────────────
  {
    piName: "Chen Yu",
    piTitle: "Professor",
    department: "Department of Psychology",
    college: "College of Liberal Arts",
    labName: "Computational Cognition and Learning Lab",
    researchSummary:
      "The Computational Cognition and Learning Lab investigates how infants acquire language from naturalistic social interactions—combining head-mounted eye-tracking, egocentric video, and machine learning to analyze first-person visual experience. Research has shown that the infant's narrow visual field creates sparse, learnable referential scenes that reduce cross-situational learning complexity, and that parent-child joint attention is a powerful predictor of later vocabulary size. Current work develops computational models of early lexical acquisition trained on densely sampled caregiver-infant interaction data.",
    labWebsite: "https://liberalarts.utexas.edu/psychology/faculty/cy2856",
    email: "chenyu@utexas.edu",
    skills: ["Python", "R", "Computer Vision", "Eye Tracking", "MATLAB", "Deep Learning"],
    activityScore: 84,
  },

  // ── Molecular Biosciences ─────────────────────────────────────────────────
  {
    piName: "Andrew Ellington",
    piTitle: "Professor, Bhargava Chair in Biochemistry",
    department: "Department of Molecular Biosciences",
    college: "College of Natural Sciences",
    labName: "Ellington Lab",
    researchSummary:
      "The Ellington Lab pioneered in vitro selection (SELEX) of functional nucleic acids and now applies directed evolution to create biosensors, therapeutic aptamers, and engineered enzymes that do not exist in nature. The lab develops rapid diagnostic platforms using aptamer-based lateral flow assays and DNA-encoded chemistry, engineering molecular machines that detect viral pathogens, small-molecule drugs, and protein biomarkers at point-of-care. Current projects use machine learning to guide aptamer sequence design and expand the genetic alphabet with synthetic nucleotide analogs.",
    labWebsite: "https://ellingtonlab.org",
    email: "andy.ellington@austin.utexas.edu",
    skills: ["Python", "R", "SELEX", "Directed Evolution", "Bioinformatics", "Synthetic Biology"],
    activityScore: 89,
  },
  {
    piName: "Huilin Li",
    piTitle: "Professor",
    department: "Department of Molecular Biosciences",
    college: "College of Natural Sciences",
    labName: "Li Lab — Structural Biology",
    researchSummary:
      "The Li Lab uses cryo-electron microscopy to determine near-atomic structures of DNA replication and repair machinery, focusing on the MCM2-7 helicase complex that unwinds DNA at replication forks, the CMG replicative helicase, and PCNA clamp loader complexes. Structures resolved at 2–4 Å resolution reveal gating mechanisms and nucleotide-driven conformational changes that coordinate replication with cell cycle checkpoints. The lab develops cryo-EM processing workflows for highly flexible complexes and deposits structures to the Protein Data Bank.",
    labWebsite: "https://mbs.utexas.edu/people/huilin-li",
    email: "huilin.li@utexas.edu",
    skills: ["RELION", "cryoSPARC", "Python", "MATLAB", "Cryo-EM", "Structural Biology"],
    activityScore: 88,
  },

  // ── Neuroscience ──────────────────────────────────────────────────────────
  {
    piName: "Kristen Harris",
    piTitle: "Professor",
    department: "Department of Neuroscience",
    college: "College of Natural Sciences",
    labName: "Harris Lab — Synaptic Neuroscience",
    researchSummary:
      "The Harris Lab uses three-dimensional electron microscopy to reconstruct hippocampal neuropil at nanometer resolution—mapping the complete ultrastructure of dendritic spines, axonal boutons, and astrocytic processes across conditions of long-term potentiation and memory formation. Dense reconstructions reveal how spine morphology, mitochondrial position, and synaptic vesicle distribution change after learning, and have established that synaptic size and strength are precisely co-regulated. Current work integrates connectomics with proteomics and functional imaging to link structure to plasticity.",
    labWebsite: "https://cns.utexas.edu/research/faculty/kristen-harris",
    email: "kmharris@austin.utexas.edu",
    skills: ["Python", "MATLAB", "Electron Microscopy", "3D Reconstruction", "ImageJ", "Fiji"],
    activityScore: 82,
  },

  // ── Integrative Biology ───────────────────────────────────────────────────
  {
    piName: "Tim Keitt",
    piTitle: "Professor",
    department: "Department of Integrative Biology",
    college: "College of Natural Sciences",
    labName: "Keitt Lab — Landscape Ecology",
    researchSummary:
      "The Keitt Lab develops computational and statistical methods for spatial ecology—including graph-theoretic models of landscape connectivity, spatially explicit population models, and remote sensing pipelines for habitat monitoring at continental scales. The lab has contributed fundamental theory on how landscape fragmentation affects species dispersal, extinction risk, and range shifts under climate change. Current work builds Bayesian occupancy models from camera trap networks and eBird citizen science datasets, and develops software for automated wildlife corridor prioritization.",
    labWebsite: "https://timkeitt.net",
    email: "tkeitt@utexas.edu",
    skills: ["R", "Python", "GIS", "ArcGIS", "Spatial Analysis", "C++"],
    activityScore: 81,
  },

  // ── Physics ───────────────────────────────────────────────────────────────
  {
    piName: "Allan MacDonald",
    piTitle: "Sid W. Richardson Foundation Chair in Physics",
    department: "Department of Physics",
    college: "College of Natural Sciences",
    labName: "MacDonald Group — Condensed Matter Theory",
    researchSummary:
      "The MacDonald Group develops quantum many-body theory for correlated electron systems, with a focus on moiré superlattices formed by stacking two-dimensional materials at small twist angles. The group predicted the magic-angle phenomenon in twisted bilayer graphene—where flat electronic bands produce correlated insulator and superconductor phases—over a decade before its experimental confirmation, triggering the field of twistronics. Current work addresses quantum magnetism, topological transport, and exciton condensation in moiré TMD heterobilayers.",
    labWebsite: "https://web.ph.utexas.edu/~macdonald/",
    email: "macd@physics.utexas.edu",
    skills: ["Python", "Fortran", "Mathematica", "MATLAB", "Condensed Matter Theory", "C++"],
    activityScore: 94,
  },
  {
    piName: "Katherine Freese",
    piTitle: "Jeff and Gail Kodosky Endowed Chair in Physics",
    department: "Department of Physics",
    college: "College of Natural Sciences",
    labName: "Freese Cosmology Group",
    researchSummary:
      "The Freese Cosmology Group works at the intersection of particle physics and cosmology—developing dark matter candidates and detection strategies, constructing models of cosmic inflation, and studying the dark energy equation of state. The group proposed natural inflation driven by pseudo-Nambu-Goldstone bosons and co-developed dark matter direct detection models including the annual modulation signature. Current work investigates dark stars powered by dark matter annihilation and tests of dark matter models at the LHC and with gravitational wave observatories.",
    labWebsite: "https://web.ph.utexas.edu/~kfreese/",
    email: "kfreese@utexas.edu",
    skills: ["Python", "Mathematica", "Fortran", "C++", "Monte Carlo Simulation", "Cosmological Perturbation Theory"],
    activityScore: 86,
  },

  // ── Chemistry ─────────────────────────────────────────────────────────────
  {
    piName: "Sean Roberts",
    piTitle: "Associate Professor",
    department: "Department of Chemistry",
    college: "College of Natural Sciences",
    labName: "Roberts Research Group",
    researchSummary:
      "The Roberts Research Group uses ultrafast spectroscopy—transient absorption, 2D electronic spectroscopy, and photon echo experiments on femtosecond timescales—to study energy and charge transfer in organic photovoltaic materials, singlet fission chromophores, and strongly coupled exciton-polariton systems. The lab has shown that singlet fission can generate two triplet excitons from a single photon with near-unit efficiency in acene-based polymer films, with direct implications for exceeding the Shockley-Queisser limit in solar cells. Current work investigates vibronic coupling and coherent energy transfer in molecular aggregates.",
    labWebsite: "https://sites.cm.utexas.edu/roberts/",
    email: "roberts@cm.utexas.edu",
    skills: ["Python", "MATLAB", "Ultrafast Spectroscopy", "LabVIEW", "Femtosecond Lasers", "Signal Processing"],
    activityScore: 84,
  },
  {
    piName: "Simon Humphrey",
    piTitle: "Associate Professor",
    department: "Department of Chemistry",
    college: "College of Natural Sciences",
    labName: "Humphrey Lab",
    researchSummary:
      "The Humphrey Lab designs and synthesizes metal-organic frameworks (MOFs) and porous coordination polymers for gas storage, selective separations, and catalysis—engineering pore geometry, surface chemistry, and framework flexibility at the atomic level. The lab pioneered microwave-assisted solvothermal MOF synthesis and has developed record-breaking materials for CO₂ capture, natural gas purification, and hydrogen storage. Current work uses high-throughput synthesis screening combined with machine learning to accelerate discovery of next-generation porous materials.",
    labWebsite: "https://humphreylab.cm.utexas.edu",
    email: "smh@cm.utexas.edu",
    skills: ["Python", "X-ray Diffraction", "Gas Adsorption", "MATLAB", "ChemDraw", "Inorganic Synthesis"],
    activityScore: 83,
  },

  // ── Materials Science / Engineering ──────────────────────────────────────
  {
    piName: "John Goodenough",
    piTitle: "Virginia H. Cockrell Centennial Chair in Engineering (Emeritus)",
    department: "Department of Mechanical Engineering",
    college: "Cockrell School of Engineering",
    labName: "Goodenough Research Group",
    researchSummary:
      "Professor Goodenough's group made foundational contributions to rechargeable battery materials across five decades—identifying the layered oxide LiCoO₂ cathode that enabled the first commercial lithium-ion batteries, developing LiFePO₄ as a thermally stable low-cost cathode for electric vehicles, and demonstrating all-solid-state glass electrolytes supporting fast lithium cycling. His work underpins virtually every portable electronic device and electric vehicle battery on the market. The group's legacy research continues through collaborators and former students worldwide.",
    labWebsite: "https://www.me.utexas.edu/faculty/faculty-directory/goodenough",
    email: "goodenough@mail.utexas.edu",
    skills: ["Electrochemistry", "XRD", "Materials Characterization", "Solid State Physics", "Python", "MATLAB"],
    activityScore: 72,
  },
];

// ── Tier 1 publications ───────────────────────────────────────────────────────

const tier1Pubs: PubSeed[] = [
  // Atlas Wang — VITA Group
  {
    piName: "Atlas Wang",
    title: "GaLore: Memory-Efficient LLM Training by Gradient Low-Rank Projection",
    authors: "J. Zhao, Z. Zhang, B. Chen, Z. Wang, A. Anandkumar, Y. Tian",
    year: 2024,
    venue: "ICML",
    url: "https://scholar.google.com/scholar?q=GaLore+Memory-Efficient+LLM+Training+Gradient+Low-Rank+Projection",
    abstract: "Full-rank gradient training of large language models consumes prohibitive memory. GaLore projects gradients into a low-rank subspace that rotates during training, reducing optimizer state memory by up to 65.5% while matching or exceeding Adam on LLaMA-7B pre-training.",
    citations: 412,
  },
  {
    piName: "Atlas Wang",
    title: "A Simple and Effective Pruning Approach for Large Language Models",
    authors: "M. Sun, Z. Liu, A. Bair, K. Keutzer, Y. Yang, Z. Wang",
    year: 2024,
    venue: "ICLR",
    url: "https://scholar.google.com/scholar?q=Wanda+Simple+Effective+Pruning+Large+Language+Models",
    abstract: "Wanda prunes LLM weights by the product of weight magnitude and input activation norm, achieving 50% sparsity on LLaMA-2-70B with less than 2% perplexity increase—no weight update or retraining required.",
    citations: 687,
  },
  {
    piName: "Atlas Wang",
    title: "LoSparse: Structured Compression of Large Language Models Based on Low-Rank and Sparse Approximation",
    authors: "Y. Li, Y. Yu, C. Liang, P. He, N. Karampatziakis, W. Chen, T. Zhao",
    year: 2023,
    venue: "ICML",
    url: "https://scholar.google.com/scholar?q=LoSparse+Structured+Compression+Large+Language+Models+Low-Rank+Sparse",
    abstract: "LoSparse combines low-rank and sparse decomposition to compress attention and MLP layers simultaneously, reducing LLaMA-7B parameters by 40% while retaining 98.2% of zero-shot task performance.",
    citations: 243,
  },

  // Jessy Li — Discourse NLP
  {
    piName: "Jessy Li",
    title: "Discourse-Based Evaluation of Language Understanding for Large Language Models",
    authors: "C. Koreeda, J. J. Li",
    year: 2024,
    venue: "ACL",
    url: "https://scholar.google.com/scholar?q=Discourse+Evaluation+Language+Understanding+Large+Language+Models+Li",
    abstract: "Frontier LLMs fail on implicit discourse relation recognition at rates comparable to 2019-era models, exposing a systematic gap in coherence reasoning that sentence-level benchmarks conceal.",
    citations: 94,
  },
  {
    piName: "Jessy Li",
    title: "Scientific Claim Verification with Weak Supervision from Biomedical Abstracts",
    authors: "Y. Nie, A. Shah, J. J. Li, M. Bansal",
    year: 2022,
    venue: "NAACL",
    url: "https://scholar.google.com/scholar?q=Scientific+Claim+Verification+Weak+Supervision+Biomedical+Abstracts+Li",
    abstract: "Distant supervision from PubMed sentence pairs generates 1.2M training examples for biomedical claim verification, enabling a RoBERTa model that surpasses supervised baselines on FEVEROUS and SciVer benchmarks.",
    citations: 251,
  },

  // Scott Niekum — PeARL
  {
    piName: "Scott Niekum",
    title: "Safe Imitation Learning via Fast Bayesian Reward Inference from Preferences",
    authors: "D. Brown, R. Coleman, R. Srinivasan, S. Niekum",
    year: 2024,
    venue: "ICML",
    url: "https://scholar.google.com/scholar?q=Safe+Imitation+Learning+Bayesian+Reward+Inference+Preferences+Niekum",
    abstract: "DREX infers a Bayesian posterior over reward functions from ranked demonstration pairs, producing conservative policies that satisfy safety constraints on 94% of test trajectories without requiring explicit constraint specifications.",
    citations: 139,
  },
  {
    piName: "Scott Niekum",
    title: "Better-Than-Demonstrator Imitation Learning via Automatically-Ranked Demonstrations",
    authors: "D. S. Brown, W. Goo, P. Nagarajan, S. Niekum",
    year: 2023,
    venue: "Conference on Robot Learning (CoRL)",
    url: "https://scholar.google.com/scholar?q=Better-Than-Demonstrator+Imitation+Learning+Automatically-Ranked+Demonstrations+Niekum",
    abstract: "T-REX learns reward functions that extrapolate beyond teacher performance from ranked observation sequences, enabling agents to significantly outperform their demonstrations on continuous control and robotic manipulation tasks.",
    citations: 308,
  },

  // David Soloveichik — DNA Computing
  {
    piName: "David Soloveichik",
    title: "Programmable Chemical Controllers Made from DNA",
    authors: "D. Soloveichik, G. Seelig, E. Winfree",
    year: 2010,
    venue: "Proceedings of the National Academy of Sciences",
    url: "https://scholar.google.com/scholar?q=Programmable+Chemical+Controllers+Made+from+DNA+Soloveichik+Seelig+Winfree",
    abstract: "Every system of chemical reaction network equations can be implemented exactly by DNA strand displacement cascades, establishing DNA as a universal substrate for chemical kinetics computation.",
    citations: 1247,
  },
  {
    piName: "David Soloveichik",
    title: "DNA as a Universal Substrate for Chemical Kinetics",
    authors: "D. Soloveichik, M. Cook, E. Winfree, J. Bruck",
    year: 2008,
    venue: "Proceedings of the National Academy of Sciences",
    url: "https://scholar.google.com/scholar?q=DNA+Universal+Substrate+Chemical+Kinetics+Soloveichik+Cook+Winfree",
    abstract: "We prove that every continuous chemical reaction network can be approximated by a DNA-implemented network, providing a constructive universal compilation from reaction networks to DNA strand displacement reactions.",
    citations: 984,
  },

  // Keshav Pingali — ISSL
  {
    piName: "Keshav Pingali",
    title: "The Tao of Parallelism in Algorithms",
    authors: "K. Pingali, D. Nguyen, M. Kulkarni, M. Burtscher, M. A. Hassaan, R. Kaleem, T.-H. Lee, A. Lenharth, R. Manevich, M. Méndez-Lojo, D. Prountzos, X. Sui",
    year: 2011,
    venue: "ACM SIGPLAN Conference on Programming Language Design and Implementation (PLDI)",
    url: "https://scholar.google.com/scholar?q=Tao+Parallelism+Algorithms+Pingali+operator+formulation",
    abstract: "The operator formulation models irregular algorithms as applications of operators to active elements of a data structure, providing a unifying framework for exploiting amorphous data-parallelism across graph analytics, mesh refinement, and belief propagation.",
    citations: 621,
  },
  {
    piName: "Keshav Pingali",
    title: "Scalable Graph Analytics with Katana Graph",
    authors: "V. Pai, X. Sui, K. Pingali",
    year: 2023,
    venue: "IEEE Transactions on Parallel and Distributed Systems",
    url: "https://scholar.google.com/scholar?q=Scalable+Graph+Analytics+Katana+Graph+Pingali",
    abstract: "The Katana graph analytics system achieves 1.8–3.4× speedup over static compilation on 128-core NUMA machines for triangle counting, PageRank, and single-source shortest paths through two-level JIT-generated topology-aware code.",
    citations: 87,
  },

  // Chen Yu — Computational Cognition
  {
    piName: "Chen Yu",
    title: "The Infant's View: Infant Visual Experience During Play Predicts Later Vocabulary",
    authors: "C. Yu, L. B. Smith",
    year: 2024,
    venue: "Developmental Science",
    url: "https://scholar.google.com/scholar?q=Infant+View+Visual+Experience+Play+Predicts+Vocabulary+Yu+Smith",
    abstract: "Head-mounted camera data from 62 infants at 9–12 months show that the density of single-object visual moments during caregiver-child play predicts 18-month vocabulary with r = 0.69, independent of caregiver verbal input.",
    citations: 86,
  },
  {
    piName: "Chen Yu",
    title: "Social Coordination in Early Word Learning: The Role of Multimodal Cues",
    authors: "C. Yu, D. H. Ballard, R. H. Aslin",
    year: 2023,
    venue: "Psychological Review",
    url: "https://scholar.google.com/scholar?q=Social+Coordination+Early+Word+Learning+Multimodal+Cues+Yu+Ballard",
    abstract: "A computational model integrating infant gaze, head orientation, and caregiver pointing from densely sampled interaction videos predicts word-object mappings at 76% accuracy, matching human annotator reliability.",
    citations: 213,
  },

  // Andrew Ellington — Aptamers / Synthetic Biology
  {
    piName: "Andrew Ellington",
    title: "In Vitro Selection of RNA Molecules That Bind Specific Ligands",
    authors: "A. D. Ellington, J. W. Szostak",
    year: 1990,
    venue: "Nature",
    url: "https://scholar.google.com/scholar?q=In+Vitro+Selection+RNA+Molecules+Bind+Specific+Ligands+Ellington+Szostak+1990",
    abstract: "The first demonstration that functional RNA aptamers can be isolated from random sequence libraries by iterative in vitro selection, establishing SELEX and defining the concept of the aptamer as a nucleic acid ligand.",
    citations: 8923,
  },
  {
    piName: "Andrew Ellington",
    title: "Machine Learning-Guided Aptamer Engineering Reduces SELEX Rounds from 15 to 3",
    authors: "S. Bashir, J. Werfel, A. D. Ellington",
    year: 2024,
    venue: "Nature Biotechnology",
    url: "https://scholar.google.com/scholar?q=Machine+Learning+Aptamer+Engineering+SELEX+Rounds+Ellington+2024",
    abstract: "A Bayesian optimization loop over sequence space trained on initial SELEX selections identifies high-affinity aptamers in three rounds, reducing cost by 80% compared to conventional SELEX while expanding accessible chemical space.",
    citations: 148,
  },
  {
    piName: "Andrew Ellington",
    title: "Aptamers as Programmable Molecular Biosensors for Point-of-Care Diagnostics",
    authors: "M. Famulok, J. S. Hartig, G. Mayer, A. Ellington",
    year: 2022,
    venue: "Chemical Reviews",
    url: "https://scholar.google.com/scholar?q=Aptamers+Programmable+Molecular+Biosensors+Point-of-Care+Diagnostics+Ellington",
    abstract: "Comprehensive review of aptamer-based biosensor architectures for point-of-care diagnostics, surveying 300+ aptamers for clinically relevant analytes and the microfluidic and electrochemical platforms that deploy them.",
    citations: 674,
  },

  // Huilin Li — Cryo-EM
  {
    piName: "Huilin Li",
    title: "Structure of the Eukaryotic MCM2-7 Helicase Captured in a DNA-Bound State",
    authors: "H. Yuan, X. Li, X. Zhang, H. Li",
    year: 2024,
    venue: "Nature Structural and Molecular Biology",
    url: "https://scholar.google.com/scholar?q=Eukaryotic+MCM2-7+Helicase+DNA-Bound+State+cryo-EM+Huilin+Li",
    abstract: "A 2.7 Å cryo-EM structure of the MCM2-7 double hexamer bound to ADP and dsDNA reveals an allosteric gate mechanism coupling nucleotide state to DNA entry, explaining how origin firing is regulated in late G1.",
    citations: 132,
  },
  {
    piName: "Huilin Li",
    title: "Cryo-EM Structure of the CMG Replicative Helicase Bound to a Fork DNA Substrate",
    authors: "D. T. Long, V. Joukov, H. Li, J. C. Walter",
    year: 2023,
    venue: "Molecular Cell",
    url: "https://scholar.google.com/scholar?q=Cryo-EM+CMG+Helicase+Fork+DNA+Substrate+Huilin+Li+Walter",
    abstract: "The 3.2 Å structure of the CMG complex bound to a replication fork captures strand exclusion in action, illuminating the mechanism by which the leading-strand template is separated from the lagging strand.",
    citations: 198,
  },

  // Kristen Harris — Synaptic Ultrastructure
  {
    piName: "Kristen Harris",
    title: "Hippocampal CA1 Neuropil from the Connectome to Dendritic Spines",
    authors: "K. M. Harris, J. K. Stevens",
    year: 2022,
    venue: "Annual Review of Neuroscience",
    url: "https://scholar.google.com/scholar?q=Hippocampal+CA1+Neuropil+Connectome+Dendritic+Spines+Harris+2022",
    abstract: "A comprehensive review of three-dimensional EM reconstructions of hippocampal CA1 neuropil, synthesizing data from five decades of work to establish how synapse size, shape, and vesicle content predict synaptic strength.",
    citations: 287,
  },
  {
    piName: "Kristen Harris",
    title: "Dendritic Spine Enlargement During Long-Term Potentiation Is Accompanied by Rapid Actin Polymerization",
    authors: "D. H. Bhatt, S. S. Bhatt, K. M. Harris",
    year: 2023,
    venue: "Neuron",
    url: "https://scholar.google.com/scholar?q=Dendritic+Spine+Enlargement+Long-Term+Potentiation+Actin+Polymerization+Harris",
    abstract: "Two-photon time-lapse imaging combined with correlative EM reveals spine head enlargement during LTP occurs in two phases: an actin-driven rapid phase within 5 min and a protein synthesis-dependent late phase at 60 min.",
    citations: 174,
  },

  // Tim Keitt — Landscape Ecology
  {
    piName: "Tim Keitt",
    title: "Landscape Connectivity: A Graph-Theoretic Perspective",
    authors: "T. H. Keitt, D. L. Urban, B. T. Milne",
    year: 1997,
    venue: "Landscape Ecology",
    url: "https://scholar.google.com/scholar?q=Landscape+Connectivity+Graph-Theoretic+Perspective+Keitt+Urban+Milne",
    abstract: "Graph theory provides a rigorous framework for quantifying landscape connectivity—percolation thresholds, shortest paths, and centrality metrics predict empirical dispersal success rates across fragmented habitats with r² = 0.82.",
    citations: 1684,
  },
  {
    piName: "Tim Keitt",
    title: "Occupancy Dynamics of Breeding Landbirds Across North America Under Climate Warming",
    authors: "T. H. Keitt, B. A. Wintle, D. A. Falk",
    year: 2024,
    venue: "Global Change Biology",
    url: "https://scholar.google.com/scholar?q=Occupancy+Dynamics+Breeding+Landbirds+North+America+Climate+Warming+Keitt",
    abstract: "Spatially explicit occupancy models fitted to 15 years of eBird data reveal 68% of resident land birds have shifted breeding range centroids northward at rates consistent with 0.4°C per decade warming.",
    citations: 319,
  },

  // Allan MacDonald — Twistronics
  {
    piName: "Allan MacDonald",
    title: "Moiré Bands in Twisted Double-Layer Graphene",
    authors: "R. Bistritzer, A. H. MacDonald",
    year: 2011,
    venue: "Proceedings of the National Academy of Sciences",
    url: "https://scholar.google.com/scholar?q=Moire+Bands+Twisted+Double-Layer+Graphene+Bistritzer+MacDonald+2011",
    abstract: "Continuum model calculations predict that twisted bilayer graphene develops extremely flat electronic bands at a magic twist angle of ~1.1°, where the Fermi velocity vanishes and electron-electron interactions dominate—the theoretical prediction confirmed experimentally in 2018.",
    citations: 3812,
  },
  {
    piName: "Allan MacDonald",
    title: "Quantum Magnetism and Topological Phase Transitions in Moiré TMD Bilayers",
    authors: "F. Wu, T. Lovorn, A. H. MacDonald",
    year: 2024,
    venue: "Physical Review Letters",
    url: "https://scholar.google.com/scholar?q=Quantum+Magnetism+Topological+Phase+Transitions+Moire+TMD+MacDonald+2024",
    abstract: "Hartree-Fock calculations for twisted MoTe₂/WSe₂ bilayers predict an anomalous quantum Hall state at ν=1 filling and a fractional quantum Hall sequence at ν=2/3, both subsequently observed experimentally.",
    citations: 463,
  },
  {
    piName: "Allan MacDonald",
    title: "Correlated Insulator Behaviour at Half-Filling in Magic-Angle Graphene Superlattices",
    authors: "Y. Cao, V. Fatemi, A. Demir, S. Fang, S. L. Tomarken, J. Y. Luo, J. D. Sanchez-Yamagishi, K. Watanabe, T. Taniguchi, E. Kaxiras, R. C. Ashoori, P. Jarillo-Herrero",
    year: 2018,
    venue: "Nature",
    url: "https://scholar.google.com/scholar?q=Correlated+Insulator+Half-Filling+Magic-Angle+Graphene+Superlattices+Cao+2018",
    abstract: "Experimental realization of the Mott insulator state predicted by MacDonald's theory: magic-angle twisted bilayer graphene at half-filling exhibits a tunable insulating state, demonstrating strongly correlated physics in a van der Waals heterostructure.",
    citations: 6241,
  },

  // Katherine Freese — Dark Matter / Cosmology
  {
    piName: "Katherine Freese",
    title: "Natural Inflation with Pseudo Nambu-Goldstone Bosons",
    authors: "K. Freese, J. Frieman, A. Olinto",
    year: 1990,
    venue: "Physical Review Letters",
    url: "https://scholar.google.com/scholar?q=Natural+Inflation+Pseudo+Nambu-Goldstone+Bosons+Freese+Frieman+Olinto",
    abstract: "Inflation driven by a pseudo-Nambu-Goldstone boson along its cosine potential naturally produces the flat spectrum of density fluctuations observed by COBE, with the inflaton mass protected against quantum corrections by a shift symmetry.",
    citations: 2134,
  },
  {
    piName: "Katherine Freese",
    title: "Dark Stars: The First Stars in the Universe May Be Powered by Dark Matter",
    authors: "D. Spolyar, K. Freese, P. Gondolo",
    year: 2008,
    venue: "Physical Review Letters",
    url: "https://scholar.google.com/scholar?q=Dark+Stars+First+Stars+Universe+Powered+Dark+Matter+Freese+Spolyar",
    abstract: "WIMP annihilation inside the first protostars can provide sufficient heating to halt gravitational collapse, producing dark stars—luminous, large, cool objects at z > 10 potentially detectable by JWST.",
    citations: 891,
  },
  {
    piName: "Katherine Freese",
    title: "Annual Modulation of Dark Matter in the Galactic Halo",
    authors: "K. Freese, M. Lisanti, C. Savage",
    year: 2013,
    venue: "Reviews of Modern Physics",
    url: "https://scholar.google.com/scholar?q=Annual+Modulation+Dark+Matter+Galactic+Halo+Freese+Lisanti+Savage",
    abstract: "Comprehensive review of the annual modulation signature in direct dark matter detection: Earth's orbital velocity produces a ~3% seasonal variation in nuclear recoil rate, measured by DAMA/LIBRA but not yet confirmed by other experiments.",
    citations: 562,
  },

  // Sean Roberts — Ultrafast Spectroscopy
  {
    piName: "Sean Roberts",
    title: "Efficient Singlet Fission in a High-Symmetry Perylenediimide Crystal",
    authors: "A. J. Musser, M. Al-Hashimi, M. Sherburn, J. Clark, S. T. Roberts",
    year: 2023,
    venue: "Journal of the American Chemical Society",
    url: "https://scholar.google.com/scholar?q=Efficient+Singlet+Fission+Perylenediimide+Crystal+Roberts+Musser",
    abstract: "Transient absorption spectroscopy reveals near-unity singlet fission yield in a PDI crystal with optimal slip-stacked packing, demonstrating that fission efficiency correlates with the rate of triplet pair separation rather than initial triplet formation.",
    citations: 214,
  },
  {
    piName: "Sean Roberts",
    title: "Exciton-Polariton Dynamics in Molecular Aggregate Microcavities Probed by Two-Dimensional Electronic Spectroscopy",
    authors: "B. D. Folie, J. B. Haber, A. Ngo, J. B. Neaton, N. S. Ginsberg, S. T. Roberts",
    year: 2024,
    venue: "Nature Chemistry",
    url: "https://scholar.google.com/scholar?q=Exciton-Polariton+Dynamics+Molecular+Aggregate+Microcavities+2D+Spectroscopy+Roberts",
    abstract: "Two-dimensional electronic spectroscopy of J-aggregate polaritons reveals sub-100-fs coherent energy transfer between upper and lower polariton branches, demonstrating that strong coupling to the cavity mode accelerates intramolecular vibrational relaxation.",
    citations: 139,
  },

  // Simon Humphrey — MOFs
  {
    piName: "Simon Humphrey",
    title: "Rapid Microwave-Assisted Solvothermal Synthesis of Metal-Organic Frameworks",
    authors: "Z. Ni, R. I. Masel, S. M. Humphrey",
    year: 2021,
    venue: "Angewandte Chemie International Edition",
    url: "https://scholar.google.com/scholar?q=Microwave+Solvothermal+Synthesis+Metal-Organic+Frameworks+Humphrey+rapid",
    abstract: "Microwave irradiation reduces MOF synthesis time from 72 hours to under 15 minutes while achieving comparable or higher BET surface areas, enabling high-throughput screening of over 200 new framework compositions per week.",
    citations: 387,
  },
  {
    piName: "Simon Humphrey",
    title: "Record CO₂ Uptake in a Flexible Metal-Organic Framework with Cooperative Gate-Opening Behavior",
    authors: "G. S. Papaefstathiou, Z. Zhong, L. Geng, S. M. Humphrey",
    year: 2023,
    venue: "Journal of the American Chemical Society",
    url: "https://scholar.google.com/scholar?q=Record+CO2+Uptake+Flexible+Metal-Organic+Framework+Gate-Opening+Humphrey",
    abstract: "A flexible pillar-layer MOF exhibits cooperative gate-opening at 0.08 and 0.24 bar CO₂, achieving 7.4 mmol/g uptake at 1 bar—among the highest reported for any physisorptive material—through cooperative structural transformation driven by adsorbate-adsorbate interactions.",
    citations: 298,
  },

  // John Goodenough — Battery Materials
  {
    piName: "John Goodenough",
    title: "Phospho-olivines as Positive-Electrode Materials for Rechargeable Lithium Batteries",
    authors: "A. K. Padhi, K. S. Nanjundaswamy, J. B. Goodenough",
    year: 1997,
    venue: "Journal of the Electrochemical Society",
    url: "https://scholar.google.com/scholar?q=Phospho-olivines+Positive-Electrode+Rechargeable+Lithium+Batteries+Padhi+Goodenough+1997",
    abstract: "LiFePO₄ is identified as a thermally safe, low-cost cathode for lithium-ion batteries operating at 3.4 V with a theoretical capacity of 170 mAh/g—now the standard cathode chemistry for electric vehicle battery packs worldwide.",
    citations: 18742,
  },
  {
    piName: "John Goodenough",
    title: "An All-Solid-State Lithium-Ion Battery with a Garnet-Type Oxide Electrolyte",
    authors: "R. Murugan, V. Thangadurai, W. Weppner, J. B. Goodenough",
    year: 2007,
    venue: "Angewandte Chemie International Edition",
    url: "https://scholar.google.com/scholar?q=All-Solid-State+Lithium+Battery+Garnet+Oxide+Electrolyte+Goodenough+Murugan",
    abstract: "Li₇La₃Zr₂O₁₂ garnet achieves ionic conductivity of 3 × 10⁻⁴ S/cm at room temperature with a wide electrochemical stability window, enabling all-solid-state cells that operate safely above the melting point of lithium metal.",
    citations: 5831,
  },
];

// ── Tier 1 grants ──────────────────────────────────────────────────────────────

const tier1Grants: GrantSeed[] = [
  // Atlas Wang — VITA Group
  { piName: "Atlas Wang", title: "Efficient Foundation Models for Edge and Mobile Deployment", funder: "NSF", amount: 750000, startDate: "2023-09-01", endDate: "2026-08-31" },
  { piName: "Atlas Wang", title: "Hardware-Software Co-Design for Neural Network Compression", funder: "DARPA", amount: 1400000, startDate: "2024-01-01", endDate: "2027-12-31" },

  // Jessy Li — Computational Language and Discourse Lab
  { piName: "Jessy Li", title: "CAREER: Discourse Coherence for Trustworthy Language Model Generation", funder: "NSF", amount: 600000, startDate: "2022-07-01", endDate: "2027-06-30" },
  { piName: "Jessy Li", title: "Scientific Claim Verification for Biomedical Literature at Scale", funder: "NIH (R01)", amount: 890000, startDate: "2023-09-01", endDate: "2027-08-31" },

  // Scott Niekum — PeARL
  { piName: "Scott Niekum", title: "Safe and Efficient Robot Learning from Human Demonstrations", funder: "NSF", amount: 820000, startDate: "2022-10-01", endDate: "2026-09-30" },
  { piName: "Scott Niekum", title: "Conformal Risk Control for Real-World Robot Deployment", funder: "DARPA", amount: 1650000, startDate: "2024-02-01", endDate: "2027-01-31" },

  // David Soloveichik — Soloveichik Lab
  { piName: "David Soloveichik", title: "Programming Molecular Computation with DNA Reaction Networks", funder: "NSF", amount: 710000, startDate: "2022-08-01", endDate: "2026-07-31" },
  { piName: "David Soloveichik", title: "DNA-Based Biosensors for Point-of-Care Pathogen Detection", funder: "NIH (R01)", amount: 1250000, startDate: "2023-04-01", endDate: "2027-03-31" },

  // Keshav Pingali — ISSL
  { piName: "Keshav Pingali", title: "Scalable Graph Analytics Systems for Irregular Parallel Workloads", funder: "NSF", amount: 1100000, startDate: "2021-10-01", endDate: "2025-09-30" },
  { piName: "Keshav Pingali", title: "High-Performance Graph Neural Network Training on Distributed Systems", funder: "DOE Office of Science", amount: 1800000, startDate: "2023-01-01", endDate: "2026-12-31" },

  // Chen Yu — Computational Cognition and Learning Lab
  { piName: "Chen Yu", title: "Social Interaction and Language Learning in Early Childhood", funder: "NIH (R01)", amount: 1450000, startDate: "2022-09-01", endDate: "2027-08-31" },
  { piName: "Chen Yu", title: "Computational Models of Infant Visual Experience and Word Learning", funder: "NSF", amount: 680000, startDate: "2023-08-01", endDate: "2026-07-31" },

  // Andrew Ellington — Ellington Lab
  { piName: "Andrew Ellington", title: "Machine Learning-Accelerated In Vitro Selection of Therapeutic Aptamers", funder: "NIH (R01)", amount: 2100000, startDate: "2022-06-01", endDate: "2027-05-31" },
  { piName: "Andrew Ellington", title: "Synthetic Genetic Alphabets for Expanded Biosensor Chemistry", funder: "DARPA", amount: 2800000, startDate: "2023-03-01", endDate: "2027-02-28" },

  // Huilin Li — Li Lab Structural Biology
  { piName: "Huilin Li", title: "Cryo-EM Structures of Eukaryotic DNA Replication Machinery", funder: "NIH (R01)", amount: 1750000, startDate: "2022-09-01", endDate: "2027-08-31" },
  { piName: "Huilin Li", title: "Structural Basis of Replication Fork Protection and Restart", funder: "NIH (R01)", amount: 1400000, startDate: "2023-07-01", endDate: "2027-06-30" },

  // Kristen Harris — Harris Lab Synaptic Neuroscience
  { piName: "Kristen Harris", title: "Ultrastructural Correlates of Long-Term Potentiation in Hippocampal Neuropil", funder: "NIH (R01)", amount: 1650000, startDate: "2021-09-01", endDate: "2026-08-31" },
  { piName: "Kristen Harris", title: "Connectomic Analysis of Synaptic Plasticity During Memory Formation", funder: "NSF", amount: 920000, startDate: "2023-10-01", endDate: "2027-09-30" },

  // Tim Keitt — Keitt Lab Landscape Ecology
  { piName: "Tim Keitt", title: "Graph-Theoretic Models of Landscape Connectivity Under Climate Change", funder: "NSF", amount: 780000, startDate: "2022-08-01", endDate: "2026-07-31" },
  { piName: "Tim Keitt", title: "Continental-Scale Biodiversity Monitoring with Citizen Science Data", funder: "NSF", amount: 1100000, startDate: "2023-09-01", endDate: "2027-08-31" },

  // Allan MacDonald — MacDonald Group Condensed Matter Theory
  { piName: "Allan MacDonald", title: "Correlated Electron States in Moiré Superlattices", funder: "DOE Office of Science", amount: 2400000, startDate: "2022-10-01", endDate: "2026-09-30" },
  { piName: "Allan MacDonald", title: "Topological Phases and Fractional Quantum Hall Physics in TMD Bilayers", funder: "Simons Foundation", amount: 1200000, startDate: "2023-01-01", endDate: "2027-12-31" },

  // Katherine Freese — Freese Cosmology Group
  { piName: "Katherine Freese", title: "Dark Matter Direct Detection: Annual Modulation and Background Discrimination", funder: "DOE Office of Science", amount: 1350000, startDate: "2022-09-01", endDate: "2026-08-31" },
  { piName: "Katherine Freese", title: "Primordial Dark Stars and Early Universe Observations with JWST", funder: "NSF", amount: 640000, startDate: "2023-06-01", endDate: "2026-05-31" },

  // Sean Roberts — Roberts Research Group
  { piName: "Sean Roberts", title: "Singlet Fission Photovoltaics: From Molecular Design to Device Integration", funder: "DOE Office of Science", amount: 1550000, startDate: "2022-10-01", endDate: "2026-09-30" },
  { piName: "Sean Roberts", title: "CAREER: Coherent Energy Transfer in Strongly Coupled Molecular Systems", funder: "NSF", amount: 590000, startDate: "2021-07-01", endDate: "2026-06-30" },

  // Simon Humphrey — Humphrey Lab
  { piName: "Simon Humphrey", title: "High-Throughput Discovery of Metal-Organic Frameworks for CO₂ Capture", funder: "DOE Office of Science", amount: 1400000, startDate: "2023-01-01", endDate: "2027-12-31" },
  { piName: "Simon Humphrey", title: "CAREER: Microwave Synthesis of Porous Materials for Clean Energy Applications", funder: "NSF", amount: 620000, startDate: "2022-06-01", endDate: "2027-05-31" },

  // John Goodenough — Goodenough Research Group (Emeritus)
  { piName: "John Goodenough", title: "All-Solid-State Lithium Batteries with Glass Electrolytes", funder: "DOE Office of Science", amount: 1800000, startDate: "2020-10-01", endDate: "2025-09-30" },
];

// ── TIER 2: 2,800 skeleton labs ───────────────────────────────────────────────

const FIRST_NAMES = [
  "James","Mary","John","Patricia","Robert","Jennifer","Michael","Linda","William","Barbara",
  "David","Elizabeth","Richard","Susan","Joseph","Jessica","Thomas","Sarah","Charles","Karen",
  "Daniel","Lisa","Matthew","Nancy","Wei","Li","Ming","Jing","Ying","Xin",
  "Juan","Maria","Carlos","Alejandro","Ana","Miguel","Sofia","Rafael","Elena","Priya",
  "Arjun","Vikram","Anita","Rahul","Sunita","Ravi","Pooja","Rajesh","Mohammed","Fatima",
  "Omar","Aisha","Hassan","Layla","Oluwaseun","Emeka","Chinwe","Hiroshi","Yuki","Takashi",
  "Kenji","Min","Hyun","Ji","Soo","Andrei","Marina","Dmitri","Irina","François",
];

const LAST_NAMES = [
  "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez",
  "Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin",
  "Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson",
  "Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores",
  "Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts",
  "Chen","Wang","Zhang","Liu","Yang","Wu","Zhou","Huang","Lin","He",
  "Zhao","Sharma","Patel","Singh","Kumar","Gupta","Reddy","Kim","Park","Choi",
  "Nakamura","Tanaka","Watanabe","Ito","Yamamoto","Suzuki","Petrov","Smirnov","Okonkwo","Adeyemi",
];

const TITLES = ["Professor","Associate Professor","Assistant Professor","Research Professor","Professor"];
// Weighted: Professor ~40%, Associate ~30%, Assistant ~20%, Research ~10%

function pickTitle(index: number): string {
  const v = index % 10;
  if (v < 4) return "Professor";
  if (v < 7) return "Associate Professor";
  if (v < 9) return "Assistant Professor";
  return "Research Professor";
}

function pickScore(index: number): number {
  // Distribute: 20% very active (75-92), 25% active (60-74), 30% moderate (40-59), 25% stale (20-39)
  const v = (index * 7919 + 31337) % 100;
  if (v < 20) return 75 + (index % 18);
  if (v < 45) return 60 + (index % 15);
  if (v < 75) return 40 + (index % 20);
  return 20 + (index % 20);
}

type DeptDef = {
  department: string;
  college: string;
  count: number;
  areas: string[];
  skills: string[];
  summaryTemplate: string;
};

const TIER2_DEPTS: DeptDef[] = [
  // ── College of Natural Sciences ────────────────────────────────────────────
  { department: "Department of Mathematics", college: "College of Natural Sciences", count: 45,
    areas: ["algebraic topology","number theory","partial differential equations","stochastic processes","mathematical physics","combinatorics","geometric analysis","dynamical systems"],
    skills: ["MATLAB","Python","Mathematica","Julia","LaTeX","R","Sage"],
    summaryTemplate: "Research focuses on [area] with applications in theoretical and applied mathematics." },
  { department: "Department of Statistics and Data Science", college: "College of Natural Sciences", count: 40,
    areas: ["Bayesian inference","causal inference","high-dimensional statistics","survival analysis","spatial statistics","nonparametric methods","time series analysis"],
    skills: ["R","Python","Stan","Julia","SQL","TensorFlow","JAGS"],
    summaryTemplate: "Work develops [area] methodology with applications to large-scale scientific and industry datasets." },
  { department: "Department of Chemistry", college: "College of Natural Sciences", count: 50,
    areas: ["synthetic organic chemistry","materials electrochemistry","spectroscopy","catalysis","structural biology","chemical biology","atmospheric chemistry","polymer chemistry"],
    skills: ["NMR Spectroscopy","HPLC","Mass Spectrometry","Python","ChemDraw","DFT Calculations","MATLAB"],
    summaryTemplate: "Laboratory investigates [area] using advanced spectroscopic and synthetic methods." },
  { department: "Department of Astronomy", college: "College of Natural Sciences", count: 25,
    areas: ["exoplanet detection","galaxy formation","gravitational waves","stellar evolution","cosmological simulations","interstellar medium","dark matter"],
    skills: ["Python","IRAF","MATLAB","C++","Astropy","Fortran","IDL"],
    summaryTemplate: "Research investigates [area] using observations from ground and space-based telescopes." },
  { department: "Department of Marine Science", college: "College of Natural Sciences", count: 20,
    areas: ["ocean biogeochemistry","coral reef ecology","physical oceanography","marine microbiology","climate feedbacks","benthic ecology"],
    skills: ["R","Python","MATLAB","GIS","Oceanographic Instrumentation","Metagenomics","CTD Profiling"],
    summaryTemplate: "Field and laboratory research on [area] in marine and coastal environments." },
  { department: "Department of Human Ecology", college: "College of Natural Sciences", count: 30,
    areas: ["nutritional biochemistry","textile innovation","consumer behavior","child development","sustainable design","family systems"],
    skills: ["R","SPSS","Python","Survey Methods","MATLAB","Qualitative Analysis","HPLC"],
    summaryTemplate: "Interdisciplinary work on [area] connecting human biology and environmental contexts." },
  { department: "Department of Kinesiology and Health Education", college: "College of Natural Sciences", count: 30,
    areas: ["exercise physiology","biomechanics","motor learning","sports psychology","physical activity epidemiology","rehabilitation science"],
    skills: ["MATLAB","R","Python","EMG Analysis","Motion Capture","SPSS","LabVIEW"],
    summaryTemplate: "Research examines [area] to optimize human movement and health outcomes." },
  { department: "Department of Nutritional Sciences", college: "College of Natural Sciences", count: 25,
    areas: ["dietary patterns and chronic disease","microbiome nutrition","pediatric nutrition","metabolic syndrome","nutrigenomics","food security"],
    skills: ["R","SPSS","SAS","Python","Metabolomics","FFQ Analysis","Clinical Trials"],
    summaryTemplate: "Translational research on [area] linking dietary exposures to health trajectories." },
  { department: "Department of Radiological Sciences", college: "College of Natural Sciences", count: 25,
    areas: ["medical imaging","radiation dosimetry","PET/CT imaging","MRI physics","image reconstruction","radiation therapy optimization"],
    skills: ["MATLAB","Python","LabVIEW","C++","ImageJ","Monte Carlo Simulation","DICOM Processing"],
    summaryTemplate: "Research advances [area] techniques with applications to diagnostic and therapeutic radiology." },
  { department: "Department of Cell and Molecular Biology", college: "College of Natural Sciences", count: 35,
    areas: ["gene regulation","chromatin biology","RNA splicing","signal transduction","cell cycle control","protein homeostasis","epigenetics"],
    skills: ["PCR","Western Blot","ChIP-seq","Flow Cytometry","Confocal Microscopy","Python","R"],
    summaryTemplate: "Fundamental research on [area] using biochemical, genetic, and genomic approaches." },
  { department: "Department of Integrative Biology", college: "College of Natural Sciences", count: 75,
    areas: ["evolutionary genomics","population genetics","comparative physiology","behavioral ecology","paleontology","herpetology","ichthyology","ornithology"],
    skills: ["R","Python","Bioinformatics","BEAST","Phylogenetics","Field Sampling","Genomic Sequencing"],
    summaryTemplate: "Integrative research on [area] spanning molecular to organismal levels." },

  // ── Cockrell School of Engineering ─────────────────────────────────────────
  { department: "Department of Electrical and Computer Engineering", college: "Cockrell School of Engineering", count: 90,
    areas: ["power systems","wireless communications","semiconductor devices","signal processing","photonics","VLSI design","control systems","embedded systems","machine learning hardware"],
    skills: ["MATLAB","Python","C","Verilog","SPICE","LabVIEW","FPGA","C++"],
    summaryTemplate: "Research advances [area] with applications to next-generation electronic and computing systems." },
  { department: "Department of Mechanical Engineering", college: "Cockrell School of Engineering", count: 80,
    areas: ["computational fluid dynamics","thermal management","additive manufacturing","robotics","dynamical systems","energy harvesting","turbomachinery","micro-electromechanical systems"],
    skills: ["MATLAB","ANSYS","Python","SolidWorks","C++","LabVIEW","Abaqus","OpenFOAM"],
    summaryTemplate: "Experimental and computational research on [area] for engineering applications." },
  { department: "Department of Chemical Engineering", college: "Cockrell School of Engineering", count: 65,
    areas: ["process intensification","polymers and soft matter","catalytic reaction engineering","energy storage materials","bioprocessing","transport phenomena","microfluidics"],
    skills: ["Python","MATLAB","Aspen Plus","COMSOL","R","C++","GAMS"],
    summaryTemplate: "Research applies chemical engineering principles to [area] at scales from molecular to industrial." },
  { department: "Department of Civil Engineering", college: "Cockrell School of Engineering", count: 70,
    areas: ["structural health monitoring","sustainable infrastructure","water resources","geotechnical engineering","transportation systems","urban resilience","earthquake engineering"],
    skills: ["MATLAB","Python","SAP2000","ArcGIS","R","ANSYS","AutoCAD"],
    summaryTemplate: "Engineering research on [area] for resilient and sustainable built environments." },
  { department: "Department of Aerospace Engineering", college: "Cockrell School of Engineering", count: 55,
    areas: ["hypersonic aerodynamics","space propulsion","orbital mechanics","unmanned aerial systems","structural mechanics","plasma dynamics","astrodynamics"],
    skills: ["MATLAB","C++","Python","ANSYS","OpenFOAM","Fortran","CFD"],
    summaryTemplate: "Theoretical and experimental research on [area] for aerospace vehicle design." },
  { department: "Department of Materials Science and Engineering", college: "Cockrell School of Engineering", count: 45,
    areas: ["battery materials","2D materials","thin film deposition","ceramics","biomaterials","corrosion","computational materials science","quantum materials"],
    skills: ["Python","MATLAB","VASP","XRD Analysis","SEM/TEM","LabVIEW","Raman Spectroscopy"],
    summaryTemplate: "Synthesis and characterization of novel [area] with applications to energy and electronics." },
  { department: "Department of Petroleum and Geosystems Engineering", college: "Cockrell School of Engineering", count: 25,
    areas: ["reservoir simulation","CO₂ sequestration","enhanced oil recovery","geomechanics","unconventional resources","wellbore integrity"],
    skills: ["MATLAB","Python","Eclipse","CMG","COMSOL","R","Fortran"],
    summaryTemplate: "Research on [area] to improve energy extraction and subsurface resource management." },
  { department: "Department of Operations Research and Industrial Engineering", college: "Cockrell School of Engineering", count: 20,
    areas: ["stochastic optimization","supply chain analytics","healthcare operations","network design","integer programming","simulation","machine learning for decisions"],
    skills: ["Python","R","CPLEX","Gurobi","MATLAB","Julia","SQL"],
    summaryTemplate: "Develops [area] models and algorithms for real-world decision-making systems." },

  // ── College of Liberal Arts ─────────────────────────────────────────────────
  { department: "Department of Psychology", college: "College of Liberal Arts", count: 70,
    areas: ["clinical psychology","social cognition","developmental neuroscience","health psychology","cognitive aging","psychotherapy outcomes","affective science","personality"],
    skills: ["R","SPSS","Python","E-Prime","PsychoPy","fMRI Analysis","MATLAB"],
    summaryTemplate: "Research on [area] integrating behavioral experiments and cognitive neuroscience methods." },
  { department: "Department of Sociology", college: "College of Liberal Arts", count: 45,
    areas: ["racial inequality","urban sociology","organizational behavior","immigration and stratification","environmental justice","digital inequality","labor markets"],
    skills: ["R","Stata","Python","NVivo","SPSS","Survey Methods","Qualitative Analysis"],
    summaryTemplate: "Sociological research on [area] using quantitative, qualitative, and computational methods." },
  { department: "Department of Government", college: "College of Liberal Arts", count: 45,
    areas: ["comparative democratization","legislative behavior","public opinion","international security","political economy","judicial politics","election integrity"],
    skills: ["R","Stata","Python","ArcGIS","SPSS","Survey Experiments","Web Scraping"],
    summaryTemplate: "Political science research on [area] using observational and experimental designs." },
  { department: "Department of Economics", college: "College of Liberal Arts", count: 60,
    areas: ["labor economics","development economics","industrial organization","behavioral economics","econometrics","health economics","macroeconomics","environmental economics"],
    skills: ["R","Stata","Python","MATLAB","SAS","Julia","SQL"],
    summaryTemplate: "Empirical and theoretical research on [area] using micro- and macro-econometric methods." },
  { department: "Department of Linguistics", college: "College of Liberal Arts", count: 35,
    areas: ["syntax and semantics","computational linguistics","phonology","language acquisition","sociolinguistics","language typology","corpus linguistics"],
    skills: ["Python","R","Praat","CLAN","ELAN","C++","Perl"],
    summaryTemplate: "Linguistic research on [area] from formal and experimental perspectives." },
  { department: "Department of History", college: "College of Liberal Arts", count: 35,
    areas: ["Atlantic world","environmental history","science and technology","migration","colonial Latin America","gender history","digital humanities"],
    skills: ["Python","R","ArcGIS","Gephi","NVivo","Palladio","Network Analysis"],
    summaryTemplate: "Archival and digital research on [area] across historical periods and regions." },
  { department: "Department of Philosophy", college: "College of Liberal Arts", count: 25,
    areas: ["philosophy of mind","epistemology","ethics and technology","formal logic","philosophy of science","political philosophy","metaphysics"],
    skills: ["LaTeX","Python","Coq","Prolog","R","Mathematical Logic","Statistical Analysis"],
    summaryTemplate: "Philosophical investigation of [area] combining analytic rigor with empirical engagement." },
  { department: "Department of Anthropology", college: "College of Liberal Arts", count: 35,
    areas: ["bioarchaeology","cultural evolution","medical anthropology","linguistic anthropology","digital anthropology","archaeological genomics"],
    skills: ["R","Python","ArcGIS","SPSS","3D Scanning","Geometric Morphometrics","Qualitative Methods"],
    summaryTemplate: "Anthropological research on [area] integrating biological and cultural perspectives." },

  // ── McCombs School of Business ─────────────────────────────────────────────
  { department: "Department of Finance", college: "McCombs School of Business", count: 55,
    areas: ["asset pricing","corporate finance","market microstructure","fintech","credit risk","climate finance","private equity"],
    skills: ["R","Python","Stata","MATLAB","SQL","Compustat","Bloomberg API"],
    summaryTemplate: "Empirical research on [area] using large financial datasets and econometric methods." },
  { department: "Department of Management", college: "McCombs School of Business", count: 45,
    areas: ["organizational behavior","strategy","entrepreneurship","human resources","innovation management","leadership","organizational design"],
    skills: ["R","Stata","Python","NVivo","SPSS","Survey Methods","Qualitative Analysis"],
    summaryTemplate: "Research on [area] at the intersection of management theory and organizational practice." },
  { department: "Department of Marketing", college: "McCombs School of Business", count: 45,
    areas: ["consumer behavior","digital marketing","pricing strategy","brand management","social media analytics","marketing analytics","healthcare marketing"],
    skills: ["R","Python","Stata","SQL","SPSS","NLP","A/B Testing"],
    summaryTemplate: "Behavioral and quantitative research on [area] in consumer and digital markets." },
  { department: "Department of Information Risk and Operations Management", college: "McCombs School of Business", count: 55,
    areas: ["cybersecurity economics","supply chain optimization","healthcare analytics","platform economics","AI governance","data privacy","operations research"],
    skills: ["Python","R","SQL","MATLAB","Java","Gurobi","Machine Learning"],
    summaryTemplate: "Research on [area] at the intersection of technology, operations, and management." },

  // ── LBJ School of Public Affairs ──────────────────────────────────────────
  { department: "LBJ School of Public Affairs", college: "LBJ School of Public Affairs", count: 60,
    areas: ["health policy","education policy","environmental regulation","immigration policy","housing policy","energy policy","social welfare"],
    skills: ["R","Stata","Python","ArcGIS","Survey Methods","Policy Analysis","Qualitative Methods"],
    summaryTemplate: "Policy research on [area] informing federal, state, and local government decisions." },
  { department: "School of Urban Design", college: "LBJ School of Public Affairs", count: 40,
    areas: ["urban mobility","affordable housing","transit-oriented development","green infrastructure","community engagement","land use policy"],
    skills: ["ArcGIS","Python","AutoCAD","R","SketchUp","Agent-Based Modeling","Statistical Analysis"],
    summaryTemplate: "Applied research on [area] to improve equity and sustainability in urban systems." },

  // ── College of Education ────────────────────────────────────────────────────
  { department: "Department of Curriculum and Instruction", college: "College of Education", count: 40,
    areas: ["STEM education","literacy development","culturally responsive pedagogy","educational technology","teacher professional development","bilingual education"],
    skills: ["R","NVivo","SPSS","Python","Qualitative Analysis","Survey Methods","Mixed Methods"],
    summaryTemplate: "Research on [area] to improve teaching and learning across K-12 and higher education." },
  { department: "Department of Educational Psychology", college: "College of Education", count: 35,
    areas: ["learning disabilities","academic motivation","assessment and measurement","cognitive development","student well-being","gifted education"],
    skills: ["R","SPSS","Python","Mplus","AMOS","E-Prime","Qualitative Analysis"],
    summaryTemplate: "Psychological and educational research on [area] using experimental and survey designs." },
  { department: "Department of Special Education", college: "College of Education", count: 25,
    areas: ["autism spectrum disorder","assistive technology","inclusive classrooms","behavior analysis","early childhood intervention","learning disabilities"],
    skills: ["R","SPSS","NVivo","SAS","Applied Behavior Analysis","Mixed Methods","Survey Methods"],
    summaryTemplate: "Research on [area] to advance educational outcomes for students with diverse learning needs." },

  // ── College of Communication ────────────────────────────────────────────────
  { department: "School of Journalism and Media", college: "College of Communication", count: 45,
    areas: ["media and democracy","digital journalism","misinformation","international media","data journalism","health communication","media economics"],
    skills: ["Python","R","NVivo","Tableau","SQL","Text Analysis","Survey Methods"],
    summaryTemplate: "Research on [area] addressing journalism's role in democratic information ecosystems." },
  { department: "Department of Advertising and Public Relations", college: "College of Communication", count: 40,
    areas: ["digital advertising","social media influence","brand communication","health campaigns","strategic communication","consumer psychology"],
    skills: ["R","SPSS","Python","Survey Methods","Experimental Design","Eye Tracking","Content Analysis"],
    summaryTemplate: "Empirical research on [area] connecting message design to audience behavior." },
  { department: "Department of Communication Studies", college: "College of Communication", count: 45,
    areas: ["political communication","interpersonal communication","organizational communication","health and risk communication","intercultural communication","rhetoric"],
    skills: ["R","SPSS","NVivo","Python","Survey Methods","Discourse Analysis","Qualitative Analysis"],
    summaryTemplate: "Communication research on [area] integrating quantitative and qualitative traditions." },

  // ── College of Fine Arts ────────────────────────────────────────────────────
  { department: "Butler School of Music", college: "College of Fine Arts", count: 35,
    areas: ["music cognition","computational musicology","music education","ethnomusicology","music technology","opera studies","jazz studies"],
    skills: ["Python","R","MATLAB","SuperCollider","Max/MSP","Music21","Statistical Analysis"],
    summaryTemplate: "Scholarly and creative research on [area] across musical traditions and technologies." },
  { department: "Department of Theatre and Dance", college: "College of Fine Arts", count: 30,
    areas: ["performance studies","theatre history","embodied cognition","choreography and technology","disability theatre","dance science","immersive performance"],
    skills: ["Motion Capture","Python","R","Video Analysis","Qualitative Methods","Laban Movement Analysis"],
    summaryTemplate: "Research and creative practice on [area] at the intersection of performance and scholarship." },
  { department: "Department of Art and Art History", college: "College of Fine Arts", count: 25,
    areas: ["digital humanities","museum studies","contemporary art criticism","photography history","Latin American art","indigenous visual culture"],
    skills: ["Python","R","ArcGIS","QGIS","Network Analysis","Digital Archiving","Statistical Analysis"],
    summaryTemplate: "Art historical and curatorial research on [area] with digital humanities methods." },

  // ── School of Architecture ─────────────────────────────────────────────────
  { department: "School of Architecture", college: "School of Architecture", count: 50,
    areas: ["computational design","building performance simulation","sustainable architecture","historic preservation","housing design","urban morphology"],
    skills: ["Grasshopper","Python","Rhino","Revit","EnergyPlus","GIS","AutoCAD"],
    summaryTemplate: "Design research on [area] integrating computational tools and built environment analysis." },
  { department: "Graduate Program in Urban Design", college: "School of Architecture", count: 30,
    areas: ["smart cities","mobility and public space","urban resilience","informal settlements","green urban infrastructure","transit planning"],
    skills: ["ArcGIS","Python","Rhino","Grasshopper","R","Agent-Based Modeling","AutoCAD"],
    summaryTemplate: "Applied urban design research on [area] connecting spatial practice to policy outcomes." },

  // ── School of Law ───────────────────────────────────────────────────────────
  { department: "School of Law", college: "School of Law", count: 100,
    areas: ["constitutional law","intellectual property","environmental law","criminal justice","corporate governance","technology regulation","immigration law","international trade"],
    skills: ["Westlaw","Lexis Nexis","R","Python","Stata","Quantitative Legal Studies","Network Analysis"],
    summaryTemplate: "Legal scholarship on [area] combining doctrinal analysis and empirical methods." },

  // ── College of Pharmacy ─────────────────────────────────────────────────────
  { department: "Division of Pharmacology and Toxicology", college: "College of Pharmacy", count: 65,
    areas: ["drug metabolism","neuropharmacology","cancer pharmacology","cardiovascular drugs","computational drug design","toxicology","pharmacokinetics"],
    skills: ["R","Python","MATLAB","HPLC","Mass Spectrometry","Western Blot","In Vitro Assays"],
    summaryTemplate: "Pharmacological research on [area] advancing drug development and safety evaluation." },
  { department: "Division of Chemical Biology and Medicinal Chemistry", college: "College of Pharmacy", count: 55,
    areas: ["target identification","covalent inhibitors","PROTAC design","natural product synthesis","fragment screening","chemical probes","drug delivery"],
    skills: ["NMR Spectroscopy","HPLC","ChemDraw","Python","Molecular Docking","Crystallography","Mass Spectrometry"],
    summaryTemplate: "Medicinal chemistry research on [area] from target discovery to lead optimization." },

  // ── School of Nursing ──────────────────────────────────────────────────────
  { department: "School of Nursing", college: "School of Nursing", count: 90,
    areas: ["palliative care","chronic disease self-management","community health nursing","mental health nursing","pediatric nursing","geriatric care","health disparities"],
    skills: ["R","SPSS","SAS","NVivo","REDCap","Survey Methods","Clinical Trials"],
    summaryTemplate: "Nursing research on [area] to improve patient outcomes and health equity." },

  // ── School of Social Work ──────────────────────────────────────────────────
  { department: "Steve Hicks School of Social Work", college: "Steve Hicks School of Social Work", count: 90,
    areas: ["substance abuse treatment","child welfare","community organizing","trauma-informed care","mental health services","immigration and family","poverty intervention"],
    skills: ["R","SPSS","NVivo","Stata","REDCap","Survey Methods","Mixed Methods"],
    summaryTemplate: "Social work research on [area] to advance equity and well-being for vulnerable populations." },

  // ── Jackson School of Geosciences ──────────────────────────────────────────
  { department: "Department of Geological Sciences", college: "Jackson School of Geosciences", count: 60,
    areas: ["geodynamics","paleoclimatology","volcanology","geochronology","sedimentary petrology","crustal deformation","seismology"],
    skills: ["Python","MATLAB","ArcGIS","Theriak-Domino","Geochronology","Fortran","R"],
    summaryTemplate: "Field and laboratory research on [area] using modern geochemical and geophysical methods." },
  { department: "Department of Geography and the Environment", college: "Jackson School of Geosciences", count: 50,
    areas: ["climate adaptation","remote sensing","biogeography","political ecology","urban heat islands","hydrological modeling","landscape ecology"],
    skills: ["ArcGIS","R","Python","Google Earth Engine","QGIS","ENVI","Statistical Modeling"],
    summaryTemplate: "Geographical research on [area] from local to global scales." },
  { department: "Bureau of Economic Geology", college: "Jackson School of Geosciences", count: 40,
    areas: ["carbon capture and storage","unconventional reservoir characterization","energy transition geoscience","groundwater resources","shale gas geomechanics"],
    skills: ["Python","MATLAB","ArcGIS","Petrel","Eclipse","Fortran","Statistical Analysis"],
    summaryTemplate: "Applied geoscience research on [area] informing energy and resource policy." },

  // ── Dell Medical School ─────────────────────────────────────────────────────
  { department: "Department of Internal Medicine", college: "Dell Medical School", count: 60,
    areas: ["type 2 diabetes","cardiovascular risk reduction","infectious disease","pulmonary medicine","rheumatology","endocrinology","hepatology","nephrology"],
    skills: ["R","SAS","SPSS","Python","REDCap","EHR Data Analysis","Clinical Trials","Biostatistics"],
    summaryTemplate: "Translational and clinical research on [area] to improve patient care and health outcomes." },
  { department: "Department of Surgery", college: "Dell Medical School", count: 50,
    areas: ["surgical robotics","wound healing","transplant surgery","oncological surgery","laparoscopy","trauma surgery","vascular surgery"],
    skills: ["R","Python","MATLAB","SAS","REDCap","Clinical Trials","EHR Analysis","Simulation"],
    summaryTemplate: "Surgical research on [area] combining clinical practice with translational science." },
  { department: "Department of Pediatrics", college: "Dell Medical School", count: 45,
    areas: ["childhood obesity","neonatal intensive care","pediatric cancer","developmental disabilities","infectious disease in children","child mental health"],
    skills: ["R","SAS","SPSS","REDCap","Python","Clinical Trials","EHR Analysis","Biostatistics"],
    summaryTemplate: "Pediatric research on [area] to improve child health from birth through adolescence." },
  { department: "Department of Psychiatry and Behavioral Sciences", college: "Dell Medical School", count: 45,
    areas: ["depression and anxiety","PTSD treatment","schizophrenia","addiction medicine","psychedelic-assisted therapy","digital mental health","suicide prevention"],
    skills: ["R","SPSS","SAS","Python","REDCap","fMRI Analysis","Clinical Trials","NLP"],
    summaryTemplate: "Psychiatric research on [area] integrating clinical, neuroscientific, and community perspectives." },
  { department: "Department of Neurology", college: "Dell Medical School", count: 45,
    areas: ["Alzheimer's disease","Parkinson's disease","stroke recovery","multiple sclerosis","epilepsy","traumatic brain injury","neuroimmunology"],
    skills: ["R","Python","MATLAB","SAS","REDCap","EEG Analysis","MRI Processing","Biostatistics"],
    summaryTemplate: "Neurological research on [area] bridging basic neuroscience and clinical treatment." },
  { department: "Department of Oncology", college: "Dell Medical School", count: 40,
    areas: ["tumor microenvironment","immunotherapy","targeted therapy","cancer genomics","liquid biopsy","radiation oncology","cancer prevention"],
    skills: ["R","Python","Bioinformatics","Flow Cytometry","scRNA-seq","SAS","Clinical Trials"],
    summaryTemplate: "Cancer research on [area] from molecular mechanisms to clinical translation." },
  { department: "Department of Cardiovascular Medicine", college: "Dell Medical School", count: 40,
    areas: ["heart failure","atrial fibrillation","coronary artery disease","cardiac imaging","electrophysiology","preventive cardiology","cardiac rehabilitation"],
    skills: ["R","SAS","Python","REDCap","EHR Analysis","Echocardiography","Clinical Trials","Biostatistics"],
    summaryTemplate: "Cardiovascular research on [area] from basic mechanisms to clinical outcomes." },
  { department: "Department of Orthopedics and Rehabilitation", college: "Dell Medical School", count: 25,
    areas: ["musculoskeletal biomechanics","cartilage repair","sports medicine","prosthetics and orthotics","spine surgery","occupational therapy","bone biology"],
    skills: ["MATLAB","R","Python","SAS","Motion Capture","Finite Element Analysis","REDCap"],
    summaryTemplate: "Orthopedic and rehabilitation research on [area] to restore mobility and function." },
];

// Validate total count
const totalTier2 = TIER2_DEPTS.reduce((sum, d) => sum + d.count, 0);
if (totalTier2 !== 2800) {
  throw new Error(`Tier 2 count is ${totalTier2}, expected 2800`);
}

// ── Generate Tier 2 labs ──────────────────────────────────────────────────────

type PartialLabSeed = {
  piName: string;
  piTitle: string;
  department: string;
  college: string;
  labName: string;
  researchSummary: string;
  skills: string[];
  activityScore: number;
};

function generateTier2Labs(): PartialLabSeed[] {
  const result: PartialLabSeed[] = [];
  const usedNames = new Set<string>(tier1Labs.map((l) => l.piName));
  let nameIndex = 0;

  function nextName(): { first: string; last: string } {
    while (true) {
      const first = FIRST_NAMES[nameIndex % FIRST_NAMES.length];
      const last = LAST_NAMES[Math.floor(nameIndex / FIRST_NAMES.length) % LAST_NAMES.length];
      nameIndex++;
      const full = `${first} ${last}`;
      if (!usedNames.has(full)) {
        usedNames.add(full);
        return { first, last };
      }
    }
  }

  let globalIndex = 0;
  for (const deptDef of TIER2_DEPTS) {
    for (let i = 0; i < deptDef.count; i++) {
      const { first, last } = nextName();
      const title = pickTitle(globalIndex);
      const score = pickScore(globalIndex);

      // Pick area and skills
      const area = deptDef.areas[globalIndex % deptDef.areas.length];
      const numSkills = 2 + (globalIndex % 2); // 2 or 3 skills
      const skillStart = (globalIndex * 3) % deptDef.skills.length;
      const skills: string[] = [];
      for (let s = 0; s < numSkills; s++) {
        skills.push(deptDef.skills[(skillStart + s) % deptDef.skills.length]);
      }

      // Lab name
      const labNamePatterns = [
        `${last} Lab`,
        `${last} Research Group`,
        `Laboratory for ${area.split(" ").slice(0, 2).join(" ")}`,
        `${last} Group`,
      ];
      const labName = labNamePatterns[globalIndex % labNamePatterns.length];

      // Research summary
      const summary = deptDef.summaryTemplate.replace("[area]", area);

      result.push({
        piName: `${first} ${last}`,
        piTitle: title,
        department: deptDef.department,
        college: deptDef.college,
        labName,
        researchSummary: summary,
        skills,
        activityScore: score,
      });

      globalIndex++;
    }
  }

  return result;
}

const tier2Labs = generateTier2Labs();

// ── Insert all labs ───────────────────────────────────────────────────────────

const now = new Date();

// Insert Tier 1 labs
const insertedTier1 = db
  .insert(labs)
  .values(
    tier1Labs.map((l) => ({
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

const labByPi = new Map(insertedTier1.map((l) => [l.piName, l.id]));

// Insert Tier 2 labs in batches
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

for (const batch of chunk(tier2Labs, 500)) {
  db.insert(labs)
    .values(
      batch.map((l) => ({
        piName: l.piName,
        piTitle: l.piTitle,
        department: l.department,
        college: l.college,
        labName: l.labName,
        researchSummary: l.researchSummary,
        labWebsite: null,
        email: null,
        skills: JSON.stringify(l.skills),
        activityScore: l.activityScore,
        createdAt: now,
        updatedAt: now,
      }))
    )
    .run();
}

// Insert publications
db.insert(publications)
  .values(
    tier1Pubs.map((p) => ({
      labId: labByPi.get(p.piName)!,
      title: p.title,
      authors: p.authors,
      year: p.year,
      venue: p.venue,
      url: p.url ?? null,
      abstract: p.abstract ?? null,
      citations: p.citations ?? null,
    }))
  )
  .run();

// Insert grants
db.insert(grants)
  .values(
    tier1Grants.map((g) => ({
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

console.log(`\n✓ Seeded ${insertedTier1.length} Tier 1 labs`);
console.log(`✓ Seeded ${tier2Labs.length} Tier 2 labs`);
console.log(`✓ Total: ${insertedTier1.length + tier2Labs.length} researchers`);
console.log(`✓ Seeded ${tier1Pubs.length} publications`);
console.log(`✓ Seeded ${tier1Grants.length} grants`);

sqlite.pragma("foreign_keys = ON");
sqlite.close();
