import React, { useState, useEffect, useRef } from 'react';
import GitHubReferencesView from './GitHubReferencesView';
import { architectCustomProject, saveCustomProject, downloadProjectScaffold, generateUnlimitedIdeas } from '../api/client';

const DOMAIN_OPTIONS = [
  'All Domains / Auto-detect',
  'Generative AI & LLM Systems',
  'Computer Vision & Edge AI',
  'Natural Language Processing',
  'Robotics & Autonomous Systems',
  'Distributed Systems & Cloud',
  'Cybersecurity & Zero-Trust',
  'FinTech & Quantitative Engineering',
  'HealthTech & Medical AI',
  'Internet of Things (IoT) & Embedded',
  'Web3 & Decentralized Systems'
];

const POPULAR_TECH = [
  'Python', 'FastAPI', 'PyTorch', 'Docker', 'React', 'TypeScript', 'Go', 'Rust', 'PostgreSQL', 'Redis', 'Kafka', 'Kubernetes', 'Next.js', 'LangChain', 'OpenCV', 'ROS2'
];

const ARCHITECTURE_STYLES = [
  { id: 'microservices', label: 'Decoupled Microservices', icon: '🧩' },
  { id: 'event_driven', label: 'Event-Driven Streaming', icon: '⚡' },
  { id: 'hexagonal', label: 'Hexagonal Clean Monolith', icon: '🏛️' },
  { id: 'serverless', label: 'Serverless Cloud Functions', icon: '☁️' }
];

const ENTERPRISE_ADDONS = [
  { id: 'auth', label: 'JWT Auth & RBAC', icon: '🔐' },
  { id: 'payments', label: 'Stripe Payments', icon: '💳' },
  { id: 'websockets', label: 'Real-Time WebSockets', icon: '⚡' },
  { id: 'rag', label: 'RAG & Vector Search', icon: '🧠' },
  { id: 'docker', label: 'Docker & K8s Deploy', icon: '🐳' },
  { id: 'testing', label: 'Pytest CI/CD Suite', icon: '🧪' }
];

const INSPIRATION_TEMPLATES = [
  {
    icon: '🤖',
    shortTitle: 'Multi-Agent Assistant',
    title: 'Autonomous Multi-Agent Research Assistant',
    prompt: 'Hierarchical multi-agent research assistant that autonomously crawls technical papers, synthesizes citations, vectors embeddings into Pinecone, and generates LaTeX literature reviews.',
    domain: 'Generative AI & LLMs',
    category: 'ai',
    tech: ['Python', 'LangChain', 'FastAPI', 'Docker']
  },
  {
    icon: '⚡',
    shortTitle: 'Order Matching Engine',
    title: 'Ultra-Low Latency Order Matching Engine',
    prompt: 'High-throughput crypto matching engine processing 50,000 orders/sec with lock-free ring buffers, WebSocket order broadcast, and real-time PnL risk calculation.',
    domain: 'FinTech & Quant',
    category: 'fintech',
    tech: ['Rust', 'Go', 'Redis', 'Docker']
  },
  {
    icon: '🚁',
    shortTitle: 'Drone 3D SLAM',
    title: 'Quadcopter Obstacle Avoidance & 3D SLAM',
    prompt: 'Autonomous drone navigation pipeline using ROS2, depth-camera perception, octree 3D voxel mapping, and real-time trajectory optimization under wind turbulence.',
    domain: 'Robotics & Vision',
    category: 'robotics',
    tech: ['C++', 'Python', 'ROS2', 'OpenCV']
  },
  {
    icon: '🛡️',
    shortTitle: 'eBPF Threat Detector',
    title: 'eBPF Real-Time Container Threat Detector',
    prompt: 'Kernel-level zero-day privilege escalation detector using Linux eBPF probes, syscall anomaly tracking, and automated container isolation with Grafana alerts.',
    domain: 'Cybersecurity',
    category: 'security',
    tech: ['Go', 'Rust', 'Linux', 'Docker']
  },
  {
    icon: '🌐',
    shortTitle: 'Distributed Vector DB',
    title: 'Distributed Log-Structured Vector Database',
    prompt: 'High-concurrency distributed vector database with Raft consensus, disk-backed HNSW approximate nearest neighbors index, and sub-10ms similarity queries across sharded clusters.',
    domain: 'Distributed Systems & Cloud',
    category: 'systems',
    tech: ['Go', 'gRPC', 'RocksDB', 'Docker']
  },
  {
    icon: '🧬',
    shortTitle: 'CRISPR Guide Predictor',
    title: 'CRISPR-Cas9 Off-Target Binding Predictor',
    prompt: 'Deep learning molecular pipeline predicting off-target cleavage probabilities for CRISPR guide RNAs using protein sequence transformers and 3D genomic chromatin maps.',
    domain: 'Bioinformatics & AI',
    category: 'science',
    tech: ['Python', 'PyTorch', 'FastAPI', 'Docker']
  },
  {
    icon: '👁️',
    shortTitle: 'Edge Multi-Object Tracker',
    title: 'Edge TPU Real-Time Object Re-ID Tracker',
    prompt: 'Low-latency multi-camera edge computer vision pipeline running YOLOv10 and DeepSORT with automated Kalman filter smoothing and hardware tensor acceleration.',
    domain: 'Computer Vision & Edge AI',
    category: 'ai',
    tech: ['Python', 'C++', 'OpenCV', 'TensorRT']
  },
  {
    icon: '⛓️',
    shortTitle: 'ZK-Rollup State Verifier',
    title: 'Zero-Knowledge Validity State Verifier',
    prompt: 'Layer-2 zero-knowledge rollup verifying thousands of off-chain transactions via Groth16 zk-SNARK circuits with on-chain Ethereum smart contract state validation.',
    domain: 'Web3 & Cryptography',
    category: 'security',
    tech: ['Rust', 'Circom', 'Solidity', 'Docker']
  },
  {
    icon: '📈',
    shortTitle: 'Automated Market Maker',
    title: 'High-Frequency Quantitative Market Maker',
    prompt: 'Automated quantitative market making system implementing Avellaneda-Stoikov inventory skew control, tick-level L2 orderbook feeds, and real-time Sharpe ratio optimization.',
    domain: 'FinTech & Quant',
    category: 'fintech',
    tech: ['Python', 'C++', 'PostgreSQL', 'Docker']
  },
  {
    icon: '🛰️',
    shortTitle: 'Satellite Telemetry Stream',
    title: 'Orbital Satellite IoT Telemetry Ingestion',
    prompt: 'Ultra-high-velocity IoT pipeline ingesting 200,000 sensor telemetry metrics/sec using Apache Kafka, stream window anomaly detection with Apache Flink, and ClickHouse OLAP storage.',
    domain: 'Data Engineering & IoT',
    category: 'systems',
    tech: ['Java', 'Python', 'Kafka', 'ClickHouse']
  },
  {
    icon: '🧠',
    shortTitle: 'RAG Refactoring Copilot',
    title: 'Semantic Code Refactoring & Migration AI',
    prompt: 'Specialized developer agent that parses full abstract syntax trees (AST), indexes repository call graphs into a vector graph, and generates verified non-breaking refactoring diffs.',
    domain: 'Generative AI & LLMs',
    category: 'ai',
    tech: ['Python', 'FastAPI', 'Tree-Sitter', 'Docker']
  },
  {
    icon: '🔬',
    shortTitle: 'Autonomous Lab Robot',
    title: 'Microfluidic Automated Pipetting Controller',
    prompt: 'Closed-loop autonomous laboratory automation system orchestrating Cartesian micro-stepper motors, computer vision droplet volume verification, and real-time MQTT telemetry.',
    domain: 'Robotics & Autonomous Systems',
    category: 'robotics',
    tech: ['Python', 'C++', 'MQTT', 'Docker']
  }
];

export default function UnlimitedStudio({
  studentProfile,
  onProjectSaved,
  onOpenPrepKit,
  onOpenMockInterview,
  onOpenCopilot,
  onIdeasGenerated,
  initialPrompt = ''
}) {
  // ── Multi-Tab Workbench Workspace State ──
  const [tabs, setTabs] = useState(() => {
    try {
      const savedTabs = localStorage.getItem('projectforge_studio_tabs_v4');
      if (savedTabs) {
        const parsed = JSON.parse(savedTabs);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading studio tabs:', e);
    }

    // Migration fallback from existing blueprint / history
    try {
      const savedBp = localStorage.getItem('projectforge_studio_blueprint');
      const savedHistory = localStorage.getItem('projectforge_studio_history');
      const savedForm = localStorage.getItem('projectforge_studio_form');
      const form = savedForm ? JSON.parse(savedForm) : {};

      const initialTabs = [];
      if (savedBp) {
        const bp = JSON.parse(savedBp);
        initialTabs.push({
          id: `tab_bp_${bp.project_id || 'main'}`,
          title: bp.title || 'AutoScholar: Hierarchical Multi-Agent Synthesis Engine',
          savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          blueprint: bp,
          promptText: form.promptText || '',
          selectedDomain: form.selectedDomain || bp.domain || DOMAIN_OPTIONS[0],
          selectedTech: form.selectedTech || bp.required_skills || ['Python', 'FastAPI', 'Docker'],
          timelineWeeks: form.timelineWeeks || bp.estimated_duration || 4,
          selectedArch: form.selectedArch || 'microservices',
          selectedAddons: form.selectedAddons || ['auth', 'docker', 'testing'],
          customSpecTabs: []
        });
      }

      if (savedHistory) {
        const hist = JSON.parse(savedHistory);
        if (Array.isArray(hist)) {
          hist.forEach((h, idx) => {
            if (initialTabs.some(t => t.title === h.title)) return;
            initialTabs.push({
              id: `tab_hist_${idx}_${Date.now()}`,
              title: h.title,
              savedAt: h.savedAt || 'Saved',
              blueprint: h,
              promptText: h.prompt || '',
              selectedDomain: h.domain || DOMAIN_OPTIONS[0],
              selectedTech: h.required_skills || ['Python', 'FastAPI', 'Docker'],
              timelineWeeks: h.estimated_duration || 4,
              selectedArch: 'microservices',
              selectedAddons: ['auth', 'docker', 'testing'],
              customSpecTabs: []
            });
          });
        }
      }

      if (initialTabs.length > 0) return initialTabs;
    } catch {}

    // Default blank initial tab
    return [{
      id: 'tab_initial_1',
      title: 'New Blueprint',
      savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      blueprint: null,
      promptText: initialPrompt || '',
      selectedDomain: DOMAIN_OPTIONS[0],
      selectedTech: ['Python', 'FastAPI', 'Docker'],
      timelineWeeks: 4,
      selectedArch: 'microservices',
      selectedAddons: ['auth', 'docker', 'testing'],
      customSpecTabs: []
    }];
  });

  const [activeTabId, setActiveTabId] = useState(() => {
    try {
      const savedActive = localStorage.getItem('projectforge_studio_active_tab_v4');
      if (savedActive && tabs.some(t => t.id === savedActive)) return savedActive;
    } catch {}
    return tabs[0]?.id || 'tab_initial_1';
  });

  // Active Tab representation
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0] || {};

  // Form State initialized from active tab
  const [promptText, setPromptText] = useState(activeTab.promptText || initialPrompt || '');
  const [selectedDomain, setSelectedDomain] = useState(activeTab.selectedDomain || DOMAIN_OPTIONS[0]);
  const [selectedTech, setSelectedTech] = useState(activeTab.selectedTech || ['Python', 'FastAPI', 'Docker']);
  const [customTechInput, setCustomTechInput] = useState('');
  const [timelineWeeks, setTimelineWeeks] = useState(activeTab.timelineWeeks || 4);
  const [selectedArch, setSelectedArch] = useState(activeTab.selectedArch || 'microservices');
  const [selectedAddons, setSelectedAddons] = useState(activeTab.selectedAddons || ['auth', 'docker', 'testing']);
  const [blueprint, setBlueprint] = useState(activeTab.blueprint || null);
  const [customSpecTabs, setCustomSpecTabs] = useState(activeTab.customSpecTabs || []);

  // Synchronize active tab in tabs list whenever inputs or blueprint change
  useEffect(() => {
    setTabs(prevTabs =>
      prevTabs.map(t => {
        if (t.id === activeTabId) {
          return {
            ...t,
            promptText,
            selectedDomain,
            selectedTech,
            timelineWeeks,
            selectedArch,
            selectedAddons,
            blueprint,
            customSpecTabs,
            title: blueprint?.title || t.title
          };
        }
        return t;
      })
    );
  }, [promptText, selectedDomain, selectedTech, timelineWeeks, selectedArch, selectedAddons, blueprint, customSpecTabs, activeTabId]);

  // Auto-save tabs and activeTabId to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('projectforge_studio_tabs_v4', JSON.stringify(tabs));
      localStorage.setItem('projectforge_studio_active_tab_v4', activeTabId);
      if (blueprint) {
        localStorage.setItem('projectforge_studio_blueprint', JSON.stringify(blueprint));
      }
    } catch (e) {
      console.warn('Could not cache studio tabs:', e);
    }
  }, [tabs, activeTabId, blueprint]);

  // Speech Recognition (Voice / Dictate concept)
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (initialPrompt) {
      setPromptText(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setPromptText((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript.trim()}` : transcript.trim();
          });
        }
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech start error:', err);
      }
    }
  };

  // Inspiration Gallery State
  const [templateCategory, setTemplateCategory] = useState('all');
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  const filteredTemplates = INSPIRATION_TEMPLATES.filter((tmpl) => {
    if (templateCategory === 'all') return true;
    return tmpl.category === templateCategory;
  });
  const visibleTemplates = showAllTemplates ? filteredTemplates : filteredTemplates.slice(0, 6);

  // UI state
  const [architecting, setArchitecting] = useState(false);
  const [batchSynthesizing, setBatchSynthesizing] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState('architecture');
  const [statusMessage, setStatusMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Strategic toggle
  const [appliedCustomizations, setAppliedCustomizations] = useState({
    architecture: true,
    security_production: true,
    resume_multiplier: true
  });

  const handleToggleTech = (t) => {
    setSelectedTech(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleAddCustomTech = (e) => {
    e.preventDefault();
    const clean = customTechInput.trim();
    if (clean && !selectedTech.includes(clean)) {
      setSelectedTech(prev => [...prev, clean]);
      setCustomTechInput('');
    }
  };

  const handleToggleAddon = (id) => {
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleApplyTemplate = (tmpl, autoRun = false) => {
    setPromptText(tmpl.prompt);
    setSelectedDomain(tmpl.domain);
    setSelectedTech(tmpl.tech);
    if (autoRun) {
      handleArchitect(tmpl.prompt, tmpl.domain, tmpl.tech);
    }
  };

  // 1-Click Instant Batch Synthesis
  const handleBatchSynthesize = async (domainName, count = 3) => {
    setBatchSynthesizing(true);
    setStatusMessage(`Synthesizing ${count} cutting-edge ${domainName} projects into the catalog...`);
    try {
      const res = await generateUnlimitedIdeas({
        studentProfile: studentProfile || {},
        prompt: `Novel, industry-grade ${domainName} production systems`,
        domain: domainName.includes('All') ? undefined : domainName,
        count: count,
        saveToCatalog: true
      });
      setStatusMessage(`🎉 Successfully added ${res.generated_projects?.length || count} new blueprints to catalog!`);
      if (onIdeasGenerated) onIdeasGenerated(res);
    } catch (err) {
      console.error(err);
      setStatusMessage(`⚠️ Batch error: ${err.message || 'Failed to synthesize.'}`);
    } finally {
      setBatchSynthesizing(false);
    }
  };

  // Architect single custom project
  const handleArchitect = async (overridePrompt, overrideDomain, overrideTech) => {
    const textToUse = (typeof overridePrompt === 'string' ? overridePrompt : promptText).trim();
    if (!textToUse) {
      setStatusMessage('⚠️ Please enter a project description or select an inspiration idea above.');
      return;
    }
    const domainToUse = overrideDomain !== undefined ? overrideDomain : selectedDomain;
    const techToUse = overrideTech !== undefined ? overrideTech : selectedTech;

    setArchitecting(true);
    setStatusMessage('🧠 AI Principal Architect formulating system blueprint, specs & contracts...');
    setSaveSuccess(false);

    try {
      const domainParam = domainToUse && !domainToUse.includes('Auto-detect') ? domainToUse : null;
      const res = await architectCustomProject({
        ideaPrompt: textToUse,
        domain: domainParam,
        preferredTech: techToUse,
        timelineWeeks: timelineWeeks,
        studentProfile: studentProfile || null
      });

      setBlueprint(res);
      setStatusMessage('✨ Architecture blueprint generated successfully! Explore tabs below.');
      setActiveResultTab('architecture');

      // Update active tab in tabs list with the formulated blueprint and title
      setTabs(prev => prev.map(t => {
        if (t.id === activeTabId) {
          return {
            ...t,
            title: res.title,
            savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            blueprint: res,
            promptText: textToUse,
            selectedDomain: domainParam || res.domain,
            selectedTech: techToUse || res.required_skills,
            timelineWeeks: timelineWeeks,
            selectedArch: selectedArch,
            selectedAddons: selectedAddons
          };
        }
        return t;
      }));
    } catch (err) {
      console.error('Architecting error:', err);
      setStatusMessage(`⚠️ Failed to architect: ${err.message || 'Unknown error'}`);
    } finally {
      setArchitecting(false);
    }
  };

  // ── Multi-Tab Operations ──
  const handleAddNewTab = () => {
    const newTabId = `tab_${Date.now()}`;
    const newTabNum = tabs.length + 1;
    const newTab = {
      id: newTabId,
      title: `Blueprint ${newTabNum}`,
      savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      blueprint: null,
      promptText: '',
      selectedDomain: DOMAIN_OPTIONS[0],
      selectedTech: ['Python', 'FastAPI', 'Docker'],
      timelineWeeks: 4,
      selectedArch: 'microservices',
      selectedAddons: ['auth', 'docker', 'testing'],
      customSpecTabs: []
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTabId);

    // Hydrate form for fresh tab
    setBlueprint(null);
    setPromptText('');
    setSelectedDomain(DOMAIN_OPTIONS[0]);
    setSelectedTech(['Python', 'FastAPI', 'Docker']);
    setTimelineWeeks(4);
    setSelectedArch('microservices');
    setSelectedAddons(['auth', 'docker', 'testing']);
    setCustomSpecTabs([]);
    setActiveResultTab('architecture');
    setStatusMessage(`✨ New Tab added: "Blueprint ${newTabNum}". Start typing your concept or pick a template!`);
  };

  const handleSwitchTab = (targetTabId) => {
    if (targetTabId === activeTabId) return;

    // 1. Ensure current active tab is updated in tabs array
    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId) {
        return {
          ...t,
          promptText,
          selectedDomain,
          selectedTech,
          timelineWeeks,
          selectedArch,
          selectedAddons,
          blueprint,
          customSpecTabs,
          title: blueprint?.title || t.title
        };
      }
      return t;
    }));

    // 2. Find target tab
    const target = tabs.find(t => t.id === targetTabId);
    if (!target) return;

    // 3. Switch active ID and hydrate state
    setActiveTabId(targetTabId);
    setBlueprint(target.blueprint || null);
    setPromptText(target.promptText || '');
    setSelectedDomain(target.selectedDomain || DOMAIN_OPTIONS[0]);
    setSelectedTech(target.selectedTech || ['Python', 'FastAPI', 'Docker']);
    setTimelineWeeks(target.timelineWeeks || 4);
    setSelectedArch(target.selectedArch || 'microservices');
    setSelectedAddons(target.selectedAddons || ['auth', 'docker', 'testing']);
    setCustomSpecTabs(target.customSpecTabs || []);
    setActiveResultTab('architecture');
    setStatusMessage(`Switched to tab: "${target.title}"`);
  };

  const handleCloseTab = (tabIdToClose, e) => {
    if (e) e.stopPropagation();

    if (tabs.length <= 1) {
      // If only one tab left, reset it rather than leaving empty
      const freshTab = {
        id: `tab_${Date.now()}`,
        title: 'New Blueprint',
        savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        blueprint: null,
        promptText: '',
        selectedDomain: DOMAIN_OPTIONS[0],
        selectedTech: ['Python', 'FastAPI', 'Docker'],
        timelineWeeks: 4,
        selectedArch: 'microservices',
        selectedAddons: ['auth', 'docker', 'testing'],
        customSpecTabs: []
      };
      setTabs([freshTab]);
      setActiveTabId(freshTab.id);
      setBlueprint(null);
      setPromptText('');
      setSelectedDomain(DOMAIN_OPTIONS[0]);
      setSelectedTech(['Python', 'FastAPI', 'Docker']);
      setTimelineWeeks(4);
      setCustomSpecTabs([]);
      setStatusMessage('Tab reset to blank canvas.');
      return;
    }

    const remaining = tabs.filter(t => t.id !== tabIdToClose);
    setTabs(remaining);

    if (tabIdToClose === activeTabId) {
      const closingIdx = tabs.findIndex(t => t.id === tabIdToClose);
      const nextIdx = closingIdx > 0 ? closingIdx - 1 : 0;
      const nextTab = remaining[nextIdx] || remaining[0];
      if (nextTab) {
        handleSwitchTab(nextTab.id);
      }
    }
  };

  const handleAddCustomSpecTab = () => {
    const title = window.prompt('Enter new section tab name (e.g. "Security & Compliance", "Deployment Runbook", "Team Milestones"):');
    if (!title || !title.trim()) return;

    const newSpecTab = {
      id: `custom_spec_${Date.now()}`,
      title: title.trim(),
      content: `## ${title.trim()}\n\nAdd your custom specifications, architecture notes, or deployment instructions here.`
    };

    setCustomSpecTabs(prev => [...prev, newSpecTab]);
    setActiveResultTab(newSpecTab.id);
  };

  const handleSaveToWorkspace = async () => {
    if (!blueprint) return;
    setSaving(true);
    try {
      const appliedList = Object.keys(appliedCustomizations).filter(k => appliedCustomizations[k]);
      await saveCustomProject(blueprint, true, appliedList);
      setSaveSuccess(true);
      setStatusMessage('🚀 Saved to My Workspace & Project Library!');
      if (onProjectSaved) onProjectSaved(blueprint);
    } catch (err) {
      console.error('Save error:', err);
      setStatusMessage(`⚠️ Failed to save: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadScaffold = async () => {
    if (!blueprint?.project_id) return;
    setDownloadingZip(true);
    try {
      await downloadProjectScaffold(blueprint.project_id, blueprint.required_skills || selectedTech);
    } catch (err) {
      console.error(err);
      alert('Failed to generate starter archive: ' + err.message);
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="studio-page-container">
      {/* ── Studio Hero Header ── */}
      <div className="studio-hero-banner">
        <div className="studio-hero-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '2rem' }}>⚡</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Unlimited Ideas & Architecture Studio
            </h1>
            <span className="studio-tag-badge">AI Architect & Customizer</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0, maxWidth: '780px' }}>
            Architect, customize, and synthesize unlimited production-grade engineering blueprints on demand.
            Choose your custom stack, architecture topology, and enterprise add-ons.
          </p>
        </div>

        {/* 1-Click Instant Batch Strip */}
        <div className="studio-batch-pills">
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            ⚡ 1-Click Batch Synthesizers:
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
            <button
              className="studio-batch-pill"
              disabled={batchSynthesizing}
              onClick={() => handleBatchSynthesize('Generative AI & LLMs', 3)}
            >
              🤖 +3 GenAI
            </button>
            <button
              className="studio-batch-pill"
              disabled={batchSynthesizing}
              onClick={() => handleBatchSynthesize('Distributed Systems & Cloud', 3)}
            >
              ⚡ +3 Cloud Native
            </button>
            <button
              className="studio-batch-pill"
              disabled={batchSynthesizing}
              onClick={() => handleBatchSynthesize('Cybersecurity & Zero-Trust', 3)}
            >
              🔒 +3 CyberSec
            </button>
            <button
              className="studio-batch-pill"
              disabled={batchSynthesizing}
              onClick={() => handleBatchSynthesize('Robotics & Autonomous Systems', 3)}
            >
              🚗 +3 Robotics
            </button>
            <button
              className="studio-batch-pill"
              disabled={batchSynthesizing}
              onClick={() => handleBatchSynthesize('FinTech & Quantitative', 3)}
            >
              📈 +3 FinTech
            </button>
          </div>
        </div>
      </div>

      {/* Status Notification */}
      {statusMessage && (
        <div className="studio-status-banner" style={{ marginBottom: '20px' }}>
          <span>{statusMessage}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setStatusMessage(null)}>✕</button>
        </div>
      )}

      {/* ── Studio Multi-Tab Workbench Bar ── */}
      <div className="studio-workbench-bar">
        <div className="studio-tabs-scrollable">
          {tabs && tabs.map((tab, idx) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                className={`studio-tab-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSwitchTab(tab.id)}
                title={tab.title || `Blueprint ${idx + 1}`}
              >
                <span className="studio-tab-icon">{tab.blueprint ? '🏛️' : '📝'}</span>
                <span className="studio-tab-title">{tab.title || `Blueprint ${idx + 1}`}</span>
                {tabs.length > 1 && (
                  <button
                    type="button"
                    className="studio-tab-close"
                    onClick={(e) => handleCloseTab(tab.id, e)}
                    title="Close tab"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
          <button
            type="button"
            className="studio-tab-add-btn"
            onClick={handleAddNewTab}
            title="Create a new blueprint tab"
          >
            <span>➕</span> New Tab
          </button>
        </div>

        <div className="studio-tab-meta">
          <span className="studio-autosave-indicator" title="All blueprints and inputs are auto-saved to your local session">
            <span className="autosave-dot" /> Auto-saved
          </span>
        </div>
      </div>

      {/* ── Studio Layout: Left Customizer Form / Right Blueprint View ── */}
      <div className="studio-layout-grid">
        {/* LEFT COLUMN: Customizer Workbench */}
        <div className="unlimited-studio-card" style={{ padding: '22px' }}>
          <div className="studio-title-group" style={{ marginBottom: '14px' }}>
            <span className="studio-icon">🛠️</span>
            <div className="studio-title" style={{ fontSize: '1.15rem' }}>
              Project Blueprint Customizer
            </div>
            <span className="studio-tag-badge">Live Config</span>
          </div>

          {/* Inspiration Quick-Picks Gallery */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>
                ✨ Instant Inspiration Templates ({visibleTemplates.length}/{INSPIRATION_TEMPLATES.length})
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.74rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => {
                    const randomTmpl = INSPIRATION_TEMPLATES[Math.floor(Math.random() * INSPIRATION_TEMPLATES.length)];
                    handleApplyTemplate(randomTmpl);
                  }}
                  title="Auto-fill with a random cutting-edge inspiration template"
                >
                  🎲 Random Idea
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.74rem', padding: '3px 8px' }}
                  onClick={() => setShowAllTemplates(!showAllTemplates)}
                >
                  {showAllTemplates ? 'Collapse (6)' : `Show All (${filteredTemplates.length})`}
                </button>
              </div>
            </div>

            {/* Quick Inspiration Domain Pills */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '10px', scrollBehavior: 'smooth' }}>
              {[
                { label: '🌟 All (12)', key: 'all' },
                { label: '🤖 AI & Vision', key: 'ai' },
                { label: '⚡ Cloud & Systems', key: 'systems' },
                { label: '📈 FinTech', key: 'fintech' },
                { label: '🔒 Security', key: 'security' },
                { label: '🚁 Robotics', key: 'robotics' },
                { label: '🧬 Bio Science', key: 'science' }
              ].map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  className={`studio-tech-chip ${templateCategory === cat.key ? 'active' : ''}`}
                  style={{ fontSize: '0.72rem', padding: '3px 8px', whiteSpace: 'nowrap' }}
                  onClick={() => setTemplateCategory(cat.key)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', transition: 'all 0.2s ease' }}>
              {visibleTemplates.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="studio-template-btn"
                  onClick={() => handleApplyTemplate(tmpl)}
                  title={tmpl.prompt}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>{tmpl.icon}</span>
                    <span className="studio-template-title">{tmpl.shortTitle}</span>
                  </div>
                  <span className="studio-template-meta">{tmpl.domain}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt / Idea Description */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Project Concept / Problem Statement</label>
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`btn btn-secondary btn-sm ${isListening ? 'listening' : ''}`}
                  style={{
                    fontSize: '0.74rem',
                    padding: '3px 9px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: isListening ? '#ef4444' : undefined,
                    borderColor: isListening ? '#ef4444' : undefined,
                    background: isListening ? 'rgba(239, 68, 68, 0.12)' : undefined
                  }}
                  title={isListening ? "Listening... click to stop" : "Talk out loud to dictate your concept"}
                >
                  <span>{isListening ? '🔴' : '🎙️'}</span>
                  <span>{isListening ? 'Listening (Speak now)...' : 'Talk / Dictate Concept'}</span>
                </button>
              )}
            </div>
            <textarea
              className="studio-input"
              rows={4}
              placeholder="Describe what you want to build (or click 'Talk / Dictate' to speak out loud)... e.g. Real-time distributed telemetry pipeline detecting network anomalies using Kafka and XGBoost..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              style={{
                fontFamily: 'inherit',
                minHeight: '92px',
                lineHeight: 1.5,
                resize: 'vertical'
              }}
            />
          </div>

          {/* Domain & Timeline Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '14px', marginBottom: '16px', alignItems: 'start' }}>
            <div>
              <label className="form-label">Engineering Domain</label>
              <select
                className="studio-select"
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
              >
                {DOMAIN_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Timeline</label>
                <span className="badge badge-primary" style={{ fontSize: '0.74rem', padding: '2px 8px' }}>
                  ⏱️ {timelineWeeks} {timelineWeeks === 1 ? 'Week' : 'Weeks'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', height: '42px' }}>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={1}
                  className="range-slider"
                  value={timelineWeeks}
                  onChange={(e) => setTimelineWeeks(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Architecture Topology Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Architecture Topology</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {ARCHITECTURE_STYLES.map((arch) => (
                <button
                  key={arch.id}
                  type="button"
                  className={`studio-arch-btn ${selectedArch === arch.id ? 'active' : ''}`}
                  onClick={() => setSelectedArch(arch.id)}
                >
                  <span>{arch.icon}</span>
                  <span>{arch.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tech Stack Customizer Chips */}
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Tech Stack Components</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {POPULAR_TECH.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`studio-tech-chip ${selectedTech.includes(t) ? 'active' : ''}`}
                  onClick={() => handleToggleTech(t)}
                >
                  {selectedTech.includes(t) ? `✓ ${t}` : `+ ${t}`}
                </button>
              ))}
            </div>
            <form onSubmit={handleAddCustomTech} style={{ display: 'flex', gap: '6px' }}>
              <input
                className="studio-input"
                style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                placeholder="Add other tech (e.g. PyTorch, Celery)..."
                value={customTechInput}
                onChange={(e) => setCustomTechInput(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                + Add
              </button>
            </form>
          </div>

          {/* Enterprise Add-on Toggles */}
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label">Enterprise & Production Add-ons</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {ENTERPRISE_ADDONS.map((addon) => (
                <button
                  key={addon.id}
                  type="button"
                  className={`studio-addon-btn ${selectedAddons.includes(addon.id) ? 'active' : ''}`}
                  onClick={() => handleToggleAddon(addon.id)}
                >
                  <span>{addon.icon}</span>
                  <span>{addon.label}</span>
                  <span style={{ marginLeft: 'auto', opacity: selectedAddons.includes(addon.id) ? 1 : 0.3 }}>
                    {selectedAddons.includes(addon.id) ? '✓' : '+'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Architect Submit CTA */}
          <button
            className="studio-btn-synthesize"
            style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
            disabled={architecting}
            onClick={() => handleArchitect()}
          >
            {architecting ? '🧠 Synthesizing Architecture...' : '🚀 Architect Custom Project'}
          </button>
        </div>

        {/* RIGHT COLUMN: Architected Blueprint & Deep Engineering Sections */}
        <div className="studio-results-container">
          {/* Studio Multi-Tab Bar */}
          <div className="studio-tabs-bar" style={{
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface-color)',
            padding: '6px 12px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            gap: '8px',
            overflowX: 'auto',
            scrollbarWidth: 'thin'
          }}>
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginRight: '2px'
            }}>
              📑 Tabs:
            </span>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', overflowX: 'auto', flex: 1, paddingBottom: '2px' }}>
              {tabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                return (
                  <div
                    key={tab.id}
                    onClick={() => handleSwitchTab(tab.id)}
                    className={`studio-tab-pill ${isActive ? 'active' : ''}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.80rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      background: isActive ? 'rgba(56, 189, 248, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                      border: isActive ? '1px solid #38bdf8' : '1px solid var(--border-color)',
                      color: isActive ? '#38bdf8' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                      maxWidth: '220px',
                      userSelect: 'none'
                    }}
                    title={tab.blueprint?.title || tab.title}
                  >
                    <span style={{ fontSize: '0.88rem' }}>
                      {tab.blueprint ? '🏛️' : '📝'}
                    </span>
                    <span style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1
                    }}>
                      {tab.blueprint?.title || tab.title}
                    </span>
                    {tab.savedAt && (
                      <span style={{ fontSize: '0.68rem', opacity: 0.65, fontWeight: 400 }}>
                        ({tab.savedAt})
                      </span>
                    )}
                    {/* Close Tab Button */}
                    <button
                      type="button"
                      onClick={(e) => handleCloseTab(tab.id, e)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'inherit',
                        padding: '0 2px',
                        fontSize: '0.82rem',
                        lineHeight: 1,
                        opacity: 0.6,
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '4px'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                      title="Close this blueprint tab"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}

              {/* ➕ Add Tab Button */}
              <button
                type="button"
                id="studio-add-tab-btn"
                onClick={handleAddNewTab}
                className="btn btn-secondary btn-xs"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  borderColor: 'rgba(56, 189, 248, 0.4)',
                  background: 'rgba(56, 189, 248, 0.08)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
                title="Add a new blueprint tab to formulate another idea"
              >
                <span style={{ fontSize: '0.92rem', fontWeight: 900 }}>➕</span>
                <span>Add Tab</span>
              </button>
            </div>

            {/* Right Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {tabs.length} {tabs.length === 1 ? 'Tab' : 'Tabs'}
              </span>
              {tabs.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Close other tabs and keep only the current active blueprint tab?')) {
                      setTabs(tabs.filter(t => t.id === activeTabId));
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    whiteSpace: 'nowrap'
                  }}
                  title="Close other tabs"
                >
                  Close Others
                </button>
              )}
            </div>
          </div>

          {architecting ? (
            <div className="unlimited-studio-card studio-empty-state" style={{ minHeight: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ fontSize: '3.4rem', marginBottom: '14px', animation: 'studioMicPulse 1.5s infinite ease-in-out' }}>🧠</div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 800 }}>
                Formulating System Architecture...
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                AI Principal Architect is formulating your system topology, database schemas (PostgreSQL DDL), REST &amp; WebSocket contracts, and starter scaffold files.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '0.84rem', fontWeight: 600 }}>
                <span className="dot-flashing" />
                <span>Generating production blueprints &amp; specs...</span>
              </div>
            </div>
          ) : !blueprint ? (
            <div className="unlimited-studio-card studio-empty-state">
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏛️</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Your Custom Engineering Architecture
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 20px auto' }}>
                Configure your tech stack and problem statement on the left, or select an inspiration template.
                The AI Principal Architect will formulate your system topology, database schemas, and API contracts.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  disabled={architecting}
                  onClick={() => handleApplyTemplate(INSPIRATION_TEMPLATES[0], true)}
                  style={{ fontWeight: 700 }}
                >
                  🚀 Architect &ldquo;Autonomous Multi-Agent Assistant&rdquo;
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={architecting}
                  onClick={() => {
                    const randomTmpl = INSPIRATION_TEMPLATES[Math.floor(Math.random() * INSPIRATION_TEMPLATES.length)];
                    handleApplyTemplate(randomTmpl, true);
                  }}
                >
                  🎲 Architect Random Idea
                </button>
              </div>
            </div>
          ) : (
            <div className="unlimited-studio-card" style={{ padding: '24px' }}>
              {/* Header Title & Scores */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
                <div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="badge badge-primary">{blueprint.domain}</span>
                    <span className="badge badge-difficulty-intermediate">{blueprint.difficulty || 'Intermediate'}</span>
                    <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>⏱️ {blueprint.estimated_duration || 4} Weeks</span>
                  </div>
                  <h2 style={{ fontSize: '1.4rem', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                    {blueprint.title}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
                    {blueprint.description}
                  </p>
                </div>

                {/* Score Pills */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div className="studio-score-pill">
                    <span className="studio-score-val">{Number(blueprint.resume_value || 9.2).toFixed(1)}</span>
                    <span className="studio-score-lbl">Resume / 10</span>
                  </div>
                  <div className="studio-score-pill">
                    <span className="studio-score-val">{Number(blueprint.originality_score || 9.4).toFixed(1)}</span>
                    <span className="studio-score-lbl">Originality / 10</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={saving || saveSuccess}
                  onClick={handleSaveToWorkspace}
                  style={{ fontWeight: 600 }}
                >
                  {saveSuccess ? '✓ Saved to Workspace' : saving ? 'Saving...' : '🚀 Save to Workspace'}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={downloadingZip}
                  onClick={handleDownloadScaffold}
                >
                  <span>📦</span> {downloadingZip ? 'Zipping...' : 'Download Starter (.zip)'}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveResultTab('github_refs')}
                  style={{ borderColor: 'rgba(56, 189, 248, 0.45)', color: '#38bdf8', fontWeight: 600 }}
                  title="Explore real open-source GitHub repositories matching this blueprint"
                >
                  <span>🐙</span> GitHub Repos
                </button>
                {onOpenPrepKit && (
                  <button className="btn btn-secondary btn-sm" onClick={() => onOpenPrepKit(blueprint)}>
                    <span>💼</span> Prep Kit
                  </button>
                )}
                {onOpenMockInterview && (
                  <button className="btn btn-secondary btn-sm" onClick={() => onOpenMockInterview(blueprint)}>
                    <span>🎙️</span> Mock Interview
                  </button>
                )}
                {onOpenCopilot && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onOpenCopilot(blueprint, `I've architected this custom project: "${blueprint.title}". Explain the system architecture and provide starter code for the first milestone.`)}
                    style={{ borderColor: 'rgba(56, 128, 105, 0.45)', color: 'var(--primary)', fontWeight: 700 }}
                  >
                    <span>💬</span> Discuss in AI Copilot
                  </button>
                )}
              </div>

              {/* Section Tabs */}
              <div className="studio-tab-strip" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  className={`studio-tab-btn ${activeResultTab === 'architecture' ? 'active' : ''}`}
                  onClick={() => setActiveResultTab('architecture')}
                >
                  🏛️ System Architecture
                </button>
                <button
                  className={`studio-tab-btn ${activeResultTab === 'contracts' ? 'active' : ''}`}
                  onClick={() => setActiveResultTab('contracts')}
                >
                  🗄️ Database & API Specs
                </button>
                <button
                  className={`studio-tab-btn ${activeResultTab === 'customizations' ? 'active' : ''}`}
                  onClick={() => setActiveResultTab('customizations')}
                >
                  ✨ Strategic Multipliers
                </button>
                <button
                  className={`studio-tab-btn ${activeResultTab === 'roadmap' ? 'active' : ''}`}
                  onClick={() => setActiveResultTab('roadmap')}
                >
                  🗺️ Sprint Roadmap
                </button>
                <button
                  className={`studio-tab-btn ${activeResultTab === 'github_refs' ? 'active' : ''}`}
                  onClick={() => setActiveResultTab('github_refs')}
                >
                  🐙 GitHub References
                </button>

                {/* Custom User-Added Section Tabs */}
                {customSpecTabs && customSpecTabs.map((specTab) => (
                  <div key={specTab.id} style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
                    <button
                      className={`studio-tab-btn ${activeResultTab === specTab.id ? 'active' : ''}`}
                      onClick={() => setActiveResultTab(specTab.id)}
                      style={{ paddingRight: '22px' }}
                    >
                      📝 {specTab.title}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Remove custom tab "${specTab.title}"?`)) {
                          setCustomSpecTabs(prev => prev.filter(t => t.id !== specTab.id));
                          if (activeResultTab === specTab.id) setActiveResultTab('architecture');
                        }
                      }}
                      style={{
                        position: 'absolute',
                        right: '6px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        padding: 0
                      }}
                      title="Remove section tab"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* ➕ Add Section Tab Button */}
                <button
                  type="button"
                  className="studio-tab-btn"
                  onClick={handleAddCustomSpecTab}
                  style={{
                    borderColor: 'rgba(56, 189, 248, 0.4)',
                    color: '#38bdf8',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Add custom section tab (e.g. Deployment Runbook, Security Audit, Team Notes)"
                >
                  <span>➕</span> Add Section Tab
                </button>
              </div>

              {/* TAB 1: SYSTEM ARCHITECTURE */}
              {activeResultTab === 'architecture' && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Decoupled Component Topology
                    </span>
                  </div>
                  {blueprint.architecture_spec?.diagram ? (
                    <div className="copilot-code-block" style={{ margin: 0 }}>
                      <div className="copilot-code-header">
                        <span>{blueprint.architecture_spec.pattern}</span>
                        <button
                          className="copilot-copy-btn"
                          onClick={() => navigator.clipboard.writeText(blueprint.architecture_spec.diagram)}
                        >
                          📋 Copy
                        </button>
                      </div>
                      <pre><code>{blueprint.architecture_spec.diagram}</code></pre>
                    </div>
                  ) : (
                    <div className="copilot-code-block" style={{ margin: 0 }}>
                      <pre><code>{`[Client Ingress] ──► [FastAPI Schema Guard] ──► [Redis Task Queue]
                                                  │
                                                  ▼
[PostgreSQL 16] ◄── [In-Memory Cache] ◄── [Worker Engine Tier]`}</code></pre>
                    </div>
                  )}

                  {blueprint.architecture_spec?.components && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
                      {blueprint.architecture_spec.components.map((c, i) => (
                        <div key={i} className="studio-component-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{c.name}</strong>
                            <span className="badge badge-sm badge-primary">{c.tech}</span>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.role}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DATABASE & API SPECS */}
              {activeResultTab === 'contracts' && (
                <div style={{ marginTop: '16px' }}>
                  {/* Database Schema */}
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        Relational Database Schema (SQL DDL)
                      </span>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                        onClick={() => navigator.clipboard.writeText(blueprint.database_schema || '')}
                      >
                        📋 Copy SQL
                      </button>
                    </div>
                    <div className="copilot-code-block" style={{ margin: 0, maxHeight: '220px', overflowY: 'auto' }}>
                      <pre><code>{blueprint.database_schema || '-- Auto-generated PostgreSQL 16 schema\nCREATE TABLE entities (\n    id UUID PRIMARY KEY,\n    status VARCHAR(32)\n);'}</code></pre>
                    </div>
                  </div>

                  {/* REST API Contract */}
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                      REST / gRPC API Contract Specifications
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(blueprint.api_contract || [
                        { method: 'POST', endpoint: '/api/v1/execute', summary: 'Core pipeline execution', status_code: 200 }
                      ]).map((api, idx) => (
                        <div key={idx} className="studio-api-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span className={`badge ${api.method === 'POST' ? 'badge-primary' : 'badge-secondary'}`} style={{ fontWeight: 700 }}>
                              {api.method}
                            </span>
                            <code style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                              {api.endpoint}
                            </code>
                            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Status: {api.status_code}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{api.summary}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: STRATEGIC MULTIPLIERS */}
              {activeResultTab === 'customizations' && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(blueprint.customization_suggestions || []).map((sug, i) => (
                    <div key={i} className="studio-multiplier-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {sug.type === 'architecture' ? '🏗️ ' : sug.type === 'security_production' ? '🔒 ' : '📈 '}
                          {sug.title}
                        </span>
                        <span className="badge badge-sm badge-secondary">{sug.type}</span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                        {sug.summary}
                      </p>
                      {sug.recommended_tools && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {sug.recommended_tools.map((t, idx) => (
                            <span key={idx} className="badge badge-sm" style={{ background: 'var(--bg-input)' }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: SPRINT ROADMAP */}
              {activeResultTab === 'roadmap' && (
                <div style={{ marginTop: '16px' }}>
                  {(blueprint.roadmap?.weeks || []).map((w, i) => (
                    <div key={i} style={{ marginBottom: '14px', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Week {w.week_number}: {w.title}</strong>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{w.goal}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {(w.tasks || []).map((task, tidx) => (
                          <div key={tidx} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            • {task}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 5+: CUSTOM SPEC / NOTES TABS */}
              {customSpecTabs && customSpecTabs.some(t => t.id === activeResultTab) && (() => {
                const currentCustomTab = customSpecTabs.find(t => t.id === activeResultTab);
                if (!currentCustomTab) return null;
                return (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        📝 {currentCustomTab.title}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 600 }}>
                        ✓ Auto-saved to blueprint
                      </span>
                    </div>
                    <textarea
                      className="studio-textarea"
                      style={{ minHeight: '220px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.86rem', lineHeight: 1.6 }}
                      value={currentCustomTab.content || ''}
                      placeholder="Write your custom notes, architecture decisions, deployment steps, or security checklist..."
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomSpecTabs(prev => prev.map(ct => ct.id === currentCustomTab.id ? { ...ct, content: val } : ct));
                      }}
                    />
                  </div>
                );
              })()}

              {/* TAB: GITHUB REFERENCES */}
              {activeResultTab === 'github_refs' && blueprint && (
                <div style={{ marginTop: '16px' }}>
                  <GitHubReferencesView
                    project={blueprint}
                    onOpenGitHubAudit={onOpenPrepKit}
                    onOpenCopilot={onOpenCopilot}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
