import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// ============================================
// R&D Resume Builder v3
// Mobile-first PWA with multi-format export
// ============================================

const STORAGE_KEY = 'rd_resume_builder_data';
const DEVICE_STORAGE_KEY = 'rd_resume_device_files';
const INSTALL_DISMISSED_KEY = 'rd_resume_install_dismissed';
const COVER_LETTERS_KEY = 'rd_resume_cover_letters';
const SUGGESTIONS_KEY = 'rd_resume_suggestions';

const DEFAULT_SECTIONS = {
  contact: { enabled: true, label: 'Contact Information' },
  experience: { enabled: true, label: 'Work Experience' },
  education: { enabled: true, label: 'Education' },
  skills: { enabled: true, label: 'Skills' },
  summary: { enabled: false, label: 'Summary / Objective' },
  certifications: { enabled: false, label: 'Certifications / Licenses' },
  clearances: { enabled: false, label: 'Security Clearances' },
  military: { enabled: false, label: 'Military Service' },
  volunteer: { enabled: false, label: 'Volunteer Experience' },
  publications: { enabled: false, label: 'Publications' },
  projects: { enabled: false, label: 'Projects / Portfolio' },
  languages: { enabled: false, label: 'Languages' },
  affiliations: { enabled: false, label: 'Professional Affiliations' },
  awards: { enabled: false, label: 'Awards / Honors' },
  references: { enabled: false, label: 'References' },
};

const CLEARANCE_LEVELS = [
  'Public Trust',
  'Confidential',
  'Secret',
  'Top Secret',
  'TS/SCI',
  'Q Clearance (DOE)',
  'L Clearance (DOE)',
];

const CLEARANCE_STATUS = ['Active', 'Inactive', 'Expired', 'In Progress'];

const DEFAULT_DATA = {
  contact: { name: '', email: '', phone: '', city: '', state: '' },
  summary: '',
  experience: [],
  education: [],
  skills: { technical: [], soft: [], industry: [] },
  certifications: [],
  clearances: [],
  military: [],
  volunteer: [],
  publications: [],
  projects: [],
  languages: [],
  affiliations: [],
  awards: [],
  references: { available: true, list: [] },
};

// Reusable Components
const Input = ({ label, required, error, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && (
      <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 6, fontWeight: 500 }}>
        {label}{required && <span style={{ color: '#ff6b6b', marginLeft: 4 }}>*</span>}
      </label>
    )}
    <input
      style={{
        width: '100%',
        padding: '14px 16px',
        fontSize: 16,
        background: 'rgba(0,0,0,0.3)',
        border: error ? '1px solid #ff6b6b' : '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        color: '#fff',
        outline: 'none',
        boxSizing: 'border-box',
      }}
      {...props}
    />
    {error && <div style={{ color: '#ff6b6b', fontSize: 12, marginTop: 4 }}>{error}</div>}
  </div>
);

const TextArea = ({ label, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 6, fontWeight: 500 }}>{label}</label>}
    <textarea 
      style={{
        width: '100%',
        padding: '14px 16px',
        fontSize: 16,
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        color: '#fff',
        outline: 'none',
        boxSizing: 'border-box',
        minHeight: 120,
        resize: 'vertical',
        fontFamily: 'inherit',
      }} 
      {...props} 
    />
  </div>
);

// Month/Year picker - uses native mobile wheel picker
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Convert "2023-03" to "Mar 2023"
const formatMonthYear = (isoDate) => {
  if (!isoDate) return '';
  const [year, month] = isoDate.split('-');
  if (!year || !month) return isoDate;
  return `${MONTHS[parseInt(month, 10) - 1]} ${year}`;
};

// Convert "Mar 2023" or "March 2023" to "2023-03"
const parseMonthYear = (display) => {
  if (!display) return '';
  // Already in ISO format
  if (/^\d{4}-\d{2}$/.test(display)) return display;

  const parts = display.trim().split(/\s+/);
  if (parts.length !== 2) return '';

  const [monthStr, yearStr] = parts;
  const monthLower = monthStr.toLowerCase();
  let monthIndex = MONTHS.findIndex(m => m.toLowerCase() === monthLower);
  if (monthIndex === -1) {
    monthIndex = FULL_MONTHS.findIndex(m => m.toLowerCase() === monthLower);
  }
  if (monthIndex === -1 || !/^\d{4}$/.test(yearStr)) return '';

  return `${yearStr}-${String(monthIndex + 1).padStart(2, '0')}`;
};

// Suggestions Manager - stores and provides auto-suggestions
const loadSuggestions = () => {
  try {
    const saved = localStorage.getItem(SUGGESTIONS_KEY);
    return saved ? JSON.parse(saved) : { companies: [], titles: [], schools: [], degrees: [], skills: [] };
  } catch {
    return { companies: [], titles: [], schools: [], degrees: [], skills: [] };
  }
};

const saveSuggestion = (category, value) => {
  if (!value || value.length < 2) return;
  const suggestions = loadSuggestions();
  if (!suggestions[category]) suggestions[category] = [];
  if (!suggestions[category].includes(value)) {
    suggestions[category] = [value, ...suggestions[category]].slice(0, 50);
    localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(suggestions));
  }
};

// AutoSuggest Input with datalist
const AutoSuggestInput = ({ label, category, ...props }) => {
  const [suggestions, setSuggestions] = useState([]);
  const listId = `suggest-${category}-${Math.random().toString(36).slice(2, 8)}`;

  useEffect(() => {
    const all = loadSuggestions();
    setSuggestions(all[category] || []);
  }, [category]);

  const handleBlur = (e) => {
    if (e.target.value) {
      saveSuggestion(category, e.target.value);
    }
    props.onBlur?.(e);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 6, fontWeight: 500 }}>{label}</label>}
      <input
        list={listId}
        style={{
          width: '100%',
          padding: '14px 16px',
          fontSize: 16,
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          color: '#fff',
          outline: 'none',
          boxSizing: 'border-box',
        }}
        {...props}
        onBlur={handleBlur}
      />
      <datalist id={listId}>
        {suggestions.map((s, i) => <option key={i} value={s} />)}
      </datalist>
    </div>
  );
};

const MonthInput = ({ label, value, onChange, placeholder, disabled, ...props }) => {
  // Convert display value to ISO for the input
  const isoValue = parseMonthYear(value) || value;

  const handleChange = (e) => {
    const newIso = e.target.value;
    // Convert ISO back to display format
    const display = formatMonthYear(newIso);
    onChange({ target: { value: display || newIso } });
  };

  // Allow dates from 1950 to 10 years in the future
  const currentYear = new Date().getFullYear();
  const minDate = "1950-01";
  const maxDate = `${currentYear + 10}-12`;

  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 6, fontWeight: 500 }}>{label}</label>}
      <input
        type="month"
        value={isoValue}
        onChange={handleChange}
        disabled={disabled}
        min={minDate}
        max={maxDate}
        style={{
          width: '100%',
          padding: '14px 16px',
          fontSize: 16,
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          color: disabled ? '#666' : '#fff',
          outline: 'none',
          boxSizing: 'border-box',
          colorScheme: 'dark',
        }}
        {...props}
      />
    </div>
  );
};

const Select = ({ label, options, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 6, fontWeight: 500 }}>{label}</label>}
    <select
      style={{
        width: '100%',
        padding: '14px 16px',
        fontSize: 16,
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        color: '#fff',
        outline: 'none',
        boxSizing: 'border-box',
      }} 
      {...props}
    >
      <option value="">Select...</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const Button = ({ children, variant, small, style = {}, ...props }) => {
  let bg = '#4a90e2';
  let border = 'none';
  if (variant === 'secondary') { bg = 'rgba(255,255,255,0.1)'; border = '1px solid rgba(255,255,255,0.2)'; }
  if (variant === 'danger') { bg = '#e24a4a'; }
  
  return (
    <button 
      style={{
        width: small ? 'auto' : '100%',
        padding: small ? '10px 16px' : 16,
        fontSize: small ? 14 : 16,
        fontWeight: 600,
        background: bg,
        color: '#fff',
        border,
        borderRadius: 12,
        cursor: 'pointer',
        minHeight: small ? 44 : 54,
        ...style,
      }} 
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, style = {} }) => (
  <div style={{
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    border: '1px solid rgba(255,255,255,0.08)',
    ...style,
  }}>
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#fff', marginTop: 0 }}>{children}</h3>
);

const EntryCard = ({ children, onEdit, onDelete }) => (
  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div style={{ flex: 1 }}>{children}</div>
      <div style={{ display: 'flex', gap: 4 }}>
        {onEdit && <button onClick={onEdit} style={{ background: 'none', border: 'none', color: '#4a90e2', cursor: 'pointer', padding: '4px 8px', fontSize: 18 }}>✎</button>}
        {onDelete && <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#e24a4a', cursor: 'pointer', padding: '4px 8px', fontSize: 20 }}>×</button>}
      </div>
    </div>
  </div>
);

const FormBox = ({ children }) => (
  <div style={{ marginTop: 16, padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
    {children}
  </div>
);

// Section Editors
const ContactEditor = ({ data, onChange, errors = {} }) => (
  <Card>
    <SectionTitle>Contact Information</SectionTitle>
    <Input label="Full Name" required value={data.name} onChange={e => onChange({ ...data, name: e.target.value })} placeholder="John Doe" error={errors.name} />
    <Input label="Email" required type="email" value={data.email} onChange={e => onChange({ ...data, email: e.target.value })} placeholder="john@email.com" error={errors.email} />
    <Input label="Phone" type="tel" value={data.phone} onChange={e => onChange({ ...data, phone: e.target.value })} placeholder="(555) 123-4567" />
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <Input label="City" required value={data.city} onChange={e => onChange({ ...data, city: e.target.value })} placeholder="Tampa" error={errors.city} />
      </div>
      <div style={{ flex: 1 }}>
        <Input label="State" required value={data.state} onChange={e => onChange({ ...data, state: e.target.value })} placeholder="FL" error={errors.state} />
      </div>
    </div>
  </Card>
);

const SummaryEditor = ({ data, onChange }) => (
  <Card>
    <SectionTitle>Summary / Objective</SectionTitle>
    <TextArea 
      value={data} 
      onChange={e => onChange(e.target.value)} 
      placeholder="Brief professional summary highlighting your key qualifications and career goals..."
    />
  </Card>
);

const ExperienceEditor = ({ data, onChange }) => {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ company: '', title: '', startDate: '', endDate: '', current: false, bullets: '' });

  const saveEntry = () => {
    if (!form.company || !form.title) return;
    const entry = { ...form, bullets: form.bullets.split('\n').filter(b => b.trim()) };
    if (editing !== null) {
      const updated = [...data];
      updated[editing] = entry;
      onChange(updated);
    } else {
      onChange([...data, entry]);
    }
    setForm({ company: '', title: '', startDate: '', endDate: '', current: false, bullets: '' });
    setEditing(null);
  };

  const editEntry = (idx) => {
    const entry = data[idx];
    setForm({ ...entry, bullets: entry.bullets.join('\n') });
    setEditing(idx);
  };

  const deleteEntry = (idx) => onChange(data.filter((_, i) => i !== idx));

  return (
    <Card>
      <SectionTitle>Work Experience</SectionTitle>
      
      {data.map((entry, idx) => (
        <EntryCard key={idx} onEdit={() => editEntry(idx)} onDelete={() => deleteEntry(idx)}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{entry.title}</div>
          <div style={{ fontSize: 14, color: '#aaa' }}>{entry.company}</div>
          <div style={{ fontSize: 14, color: '#aaa' }}>{entry.startDate} - {entry.current ? 'Present' : entry.endDate}</div>
        </EntryCard>
      ))}

      <FormBox>
        <AutoSuggestInput label="Company" category="companies" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Company Name" />
        <AutoSuggestInput label="Job Title" category="titles" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Software Engineer" />
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <MonthInput label="Start Date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <MonthInput label="End Date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} disabled={form.current} />
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, cursor: 'pointer', marginBottom: 16 }}>
          <input type="checkbox" style={{ width: 22, height: 22, accentColor: '#4a90e2' }} checked={form.current} onChange={e => setForm({ ...form, current: e.target.checked })} />
          Currently working here
        </label>
        <TextArea 
          label="Key Accomplishments (one per line)" 
          value={form.bullets} 
          onChange={e => setForm({ ...form, bullets: e.target.value })} 
          placeholder={"Led team of 5 engineers\nReduced processing time by 40%\nImplemented new CI/CD pipeline"}
        />
        <Button onClick={saveEntry} small>{editing !== null ? 'Update' : 'Add'} Experience</Button>
      </FormBox>
    </Card>
  );
};

const EducationEditor = ({ data, onChange }) => {
  const [form, setForm] = useState({ school: '', degree: '', field: '', graduationDate: '', gpa: '' });

  const saveEntry = () => {
    if (!form.school || !form.degree) return;
    onChange([...data, form]);
    setForm({ school: '', degree: '', field: '', graduationDate: '', gpa: '' });
  };

  const deleteEntry = (idx) => onChange(data.filter((_, i) => i !== idx));

  return (
    <Card>
      <SectionTitle>Education</SectionTitle>
      
      {data.map((entry, idx) => (
        <EntryCard key={idx} onDelete={() => deleteEntry(idx)}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{entry.degree} {entry.field && `in ${entry.field}`}</div>
          <div style={{ fontSize: 14, color: '#aaa' }}>{entry.school}</div>
          <div style={{ fontSize: 14, color: '#aaa' }}>{entry.graduationDate} {entry.gpa && `• GPA: ${entry.gpa}`}</div>
        </EntryCard>
      ))}

      <FormBox>
        <AutoSuggestInput label="School" category="schools" value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} placeholder="University of Florida" />
        <AutoSuggestInput label="Degree" category="degrees" value={form.degree} onChange={e => setForm({ ...form, degree: e.target.value })} placeholder="Bachelor of Science" />
        <Input label="Field of Study" value={form.field} onChange={e => setForm({ ...form, field: e.target.value })} placeholder="Computer Science" />
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <MonthInput label="Graduation Date" value={form.graduationDate} onChange={e => setForm({ ...form, graduationDate: e.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <Input label="GPA (optional)" value={form.gpa} onChange={e => setForm({ ...form, gpa: e.target.value })} placeholder="3.8" />
          </div>
        </div>
        <Button onClick={saveEntry} small>Add Education</Button>
      </FormBox>
    </Card>
  );
};

// Skill suggestions for autocomplete
const SKILL_SUGGESTIONS = {
  technical: [
    // Languages
    'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Kotlin', 'Swift',
    // Web Frameworks
    'React', 'Vue.js', 'Angular', 'Next.js', 'Node.js', 'Express.js', 'Django', 'FastAPI', 'Spring Boot', 'ASP.NET',
    // Cloud & DevOps
    'AWS', 'Azure', 'Google Cloud Platform', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Jenkins', 'GitHub Actions', 'GitLab CI',
    // Databases
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Apache Cassandra', 'DynamoDB', 'SQL',
    // Big Data & Streaming
    'Apache Kafka', 'Apache Spark', 'Hadoop', 'Apache Flink',
    // Other Technical
    'REST APIs', 'GraphQL', 'Microservices', 'Linux/Unix', 'Git', 'Excel', 'Power BI', 'Tableau', 'MATLAB', 'R',
    'AutoCAD', 'SolidWorks', 'Figma', 'Adobe Creative Suite', 'Salesforce', 'SAP', 'Jira'
  ],
  soft: [
    'Leadership', 'Team Mentoring', 'Communication', 'Problem Solving', 'Critical Thinking',
    'Project Management', 'Teamwork', 'Collaboration', 'Agile Methodology', 'Negotiation',
    'Adaptability', 'Initiative', 'Emotional Intelligence', 'Conflict Resolution', 'Decision Making',
    'Time Management', 'Attention to Detail', 'Presentation Skills', 'Public Speaking', 'Documentation',
    'Networking', 'Active Listening', 'Mentorship', 'Coaching', 'Delegation', 'Strategic Planning',
    'Cross-functional Collaboration', 'Empathy', 'Flexibility', 'Curiosity'
  ],
  industry: [
    // Methodologies
    'Agile/Scrum', 'Kanban', 'Waterfall', 'Lean', 'Six Sigma',
    // Architecture & Design
    'Microservices Architecture', 'System Design', 'Database Design', 'Cloud Architecture', 'Enterprise Architecture', 'Solution Architecture',
    // Quality & Testing
    'Test Automation', 'Unit Testing', 'Integration Testing', 'Selenium', 'JUnit', 'PyTest', 'Test-Driven Development', 'Performance Testing',
    // Specialized
    'Machine Learning', 'Data Engineering', 'Data Science', 'Business Intelligence', 'Analytics', 'Security',
    // Compliance & Standards
    'HIPAA', 'SOC 2', 'GDPR', 'PCI-DSS', 'ISO 27001',
    // DevOps & Infrastructure
    'Infrastructure as Code', 'Configuration Management', 'Monitoring', 'Logging', 'Observability', 'Database Administration'
  ]
};

// Aviation keywords for smart filtering (170 curated from 1,664 total)
const AVIATION_KEYWORDS = [
  // Certifications
  'A&P License', 'Airframe and Powerplant', 'FAA Certificated', 'IA', 'Inspection Authorization',
  'Repairman Certificate', 'FCC License', 'GROL', 'NDT Certification', 'ASQ CQE', 'ASQ CQA',
  // Regulatory
  'FAA', 'EASA', 'FAR', 'Federal Aviation Regulations', '14 CFR', 'Part 43', 'Part 65',
  'Part 91', 'Part 121', 'Part 135', 'Part 145', 'Airworthiness Directive', 'AD Compliance',
  'Service Bulletin', 'Type Certificate', 'STC', 'PMA', 'TSO', 'DER', 'DAR',
  // Maintenance Types
  'Line Maintenance', 'Base Maintenance', 'Heavy Maintenance', 'A Check', 'B Check', 'C Check', 'D Check',
  'Phase Check', 'Progressive Inspection', '100-Hour Inspection', 'Annual Inspection', 'AOG', 'Aircraft on Ground',
  // Aircraft Systems
  'Airframe', 'Powerplant', 'Avionics', 'Electrical Systems', 'Hydraulic Systems', 'Pneumatic Systems',
  'Fuel Systems', 'Flight Controls', 'Landing Gear', 'ECS', 'APU', 'Turbofan', 'Turboprop',
  // Quality
  'Quality Control', 'QC', 'Quality Assurance', 'QA', 'QMS', 'AS9100', 'AS9110', 'NADCAP',
  'First Article Inspection', 'FAI', 'Receiving Inspection', 'In-Process Inspection', 'SPC',
  // Safety
  'Safety Management System', 'SMS', 'Human Factors', 'CRM', 'MRM', 'Just Culture', 'Hazard Identification',
  // Skills
  'Troubleshooting', 'Fault Isolation', 'Blueprint Reading', 'Schematic Interpretation', 'Wiring Diagram Interpretation',
  'Sheet Metal Repair', 'Composite Repair', 'Corrosion Control', 'NDT', 'Borescope Inspection',
  // Software
  'AMOS', 'TRAX', 'Ramco', 'Maximo', 'Maintenix', 'OASES',
  // Documentation
  'Aircraft Maintenance Manual', 'AMM', 'IPC', 'CMM', 'SRM', 'MEL', 'CDL',
  // Processes
  'Continuous Airworthiness', 'Reliability Program', 'Configuration Control', 'Maintenance Planning'
];

// Triggers to detect aviation job context
const AVIATION_TRIGGERS = [
  'faa', 'easa', 'aircraft', 'aviation', 'airline', 'aerospace', 'a&p', 'airframe',
  'powerplant', 'avionics', 'mro', 'part 121', 'part 135', 'part 145', 'airworthiness',
  'mechanic', 'amt', 'pilot', 'flight', 'hangar', 'maintenance manual'
];

// Detect if job description is aviation-related
const detectAviationContext = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return AVIATION_TRIGGERS.some(trigger => lower.includes(trigger));
};

// Individual skill section - uncontrolled input to prevent focus loss
const SkillSection = React.memo(({ category, label, skills, allSuggestions, onAdd, onRemove, isLast }) => {
  const inputRef = useRef(null);
  const [debouncedInput, setDebouncedInput] = useState('');
  const debounceRef = useRef(null);

  const existingLower = useMemo(() => skills.map(s => s.toLowerCase()), [skills]);

  // Debounced suggestion update - doesn't affect input focus
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedInput(value), 150);
  }, []);

  // Calculate suggestions from debounced input - prefix matches first, then contains
  const suggestions = useMemo(() => {
    if (!debouncedInput.trim()) return [];
    const lower = debouncedInput.toLowerCase();
    const available = allSuggestions.filter(s => !existingLower.includes(s.toLowerCase()));
    const prefixMatches = available.filter(s => s.toLowerCase().startsWith(lower));
    const containsMatches = available.filter(s => !s.toLowerCase().startsWith(lower) && s.toLowerCase().includes(lower));
    return [...prefixMatches, ...containsMatches].slice(0, 5);
  }, [debouncedInput, allSuggestions, existingLower]);

  const quickPicks = useMemo(() => {
    if (debouncedInput.trim()) return [];
    return allSuggestions.filter(s => !existingLower.includes(s.toLowerCase())).slice(0, 6);
  }, [debouncedInput, allSuggestions, existingLower]);

  const handleAdd = useCallback((value) => {
    const trimmed = (value || '').trim();
    if (!trimmed || existingLower.includes(trimmed.toLowerCase())) return;
    onAdd(trimmed);
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
    setDebouncedInput('');
  }, [existingLower, onAdd]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd(inputRef.current?.value);
    }
  }, [handleAdd]);

  const handleButtonClick = useCallback(() => {
    handleAdd(inputRef.current?.value);
  }, [handleAdd]);

  return (
    <div style={{ marginBottom: isLast ? 8 : 24 }}>
      <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 6, fontWeight: 500 }}>{label}</label>

      {/* Skill tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 8, minHeight: 20 }}>
        {skills.map((skill, idx) => (
          <span key={skill} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 12px', background: 'rgba(74, 144, 226, 0.2)', borderRadius: 20, fontSize: 14, margin: 4, color: '#8bb8e8' }}>
            {skill}
            <button onClick={() => onRemove(idx)} style={{ background: 'none', border: 'none', color: '#e24a4a', marginLeft: 6, cursor: 'pointer', padding: 0, fontSize: 16 }}>×</button>
          </span>
        ))}
      </div>

      {/* Input row - UNCONTROLLED to prevent focus loss */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          ref={inputRef}
          style={{ flex: 1, padding: '14px 16px', fontSize: 16, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', outline: 'none', boxSizing: 'border-box' }}
          defaultValue=""
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type or pick a skill..."
        />
        <Button small onClick={handleButtonClick}>+</Button>
      </div>

      {/* Autocomplete suggestions - stable container */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: suggestions.length ? 8 : 0 }}>
        {suggestions.map(skill => (
          <button key={skill} onClick={() => handleAdd(skill)} style={{ padding: '6px 12px', background: 'rgba(74, 226, 74, 0.15)', border: '1px solid rgba(74, 226, 74, 0.3)', borderRadius: 16, color: '#7be87b', fontSize: 13, cursor: 'pointer' }}>
            + {skill}
          </button>
        ))}
      </div>

      {/* Quick picks */}
      {quickPicks.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>Quick add:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {quickPicks.map(skill => (
              <button key={skill} onClick={() => handleAdd(skill)} style={{ padding: '5px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, color: '#888', fontSize: 12, cursor: 'pointer' }}>
                {skill}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// Skills editor - each section is isolated to prevent focus loss
const SkillsEditor = ({ data, onChange, jobDescription }) => {
  // Detect aviation context and merge aviation keywords into industry suggestions
  const isAviationJob = detectAviationContext(jobDescription);
  const industrySuggestions = useMemo(() => {
    if (isAviationJob) {
      // Merge aviation keywords (prioritized) with general industry skills
      const combined = [...AVIATION_KEYWORDS, ...SKILL_SUGGESTIONS.industry];
      // Remove duplicates
      const seen = new Set();
      return combined.filter(s => {
        const lower = s.toLowerCase();
        if (seen.has(lower)) return false;
        seen.add(lower);
        return true;
      });
    }
    return SKILL_SUGGESTIONS.industry;
  }, [isAviationJob]);

  return (
    <Card>
      <SectionTitle>Skills</SectionTitle>
      {isAviationJob && (
        <div style={{ background: 'rgba(74, 226, 74, 0.1)', border: '1px solid rgba(74, 226, 74, 0.3)', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 13, color: '#7be87b' }}>
          ✈️ Aviation job detected — showing 170+ aviation-specific skills
        </div>
      )}
      <SkillSection
        category="technical"
        label="Technical Skills"
        skills={data.technical}
        allSuggestions={SKILL_SUGGESTIONS.technical}
        onAdd={(skill) => onChange({ ...data, technical: [...data.technical, skill] })}
        onRemove={(idx) => onChange({ ...data, technical: data.technical.filter((_, i) => i !== idx) })}
      />
      <SkillSection
        category="soft"
        label="Soft Skills"
        skills={data.soft}
        allSuggestions={SKILL_SUGGESTIONS.soft}
        onAdd={(skill) => onChange({ ...data, soft: [...data.soft, skill] })}
        onRemove={(idx) => onChange({ ...data, soft: data.soft.filter((_, i) => i !== idx) })}
      />
      <SkillSection
        category="industry"
        label={isAviationJob ? "Industry / Aviation Skills" : "Industry / Domain Skills"}
        skills={data.industry}
        allSuggestions={industrySuggestions}
        onAdd={(skill) => onChange({ ...data, industry: [...data.industry, skill] })}
        onRemove={(idx) => onChange({ ...data, industry: data.industry.filter((_, i) => i !== idx) })}
        isLast
      />
    </Card>
  );
};

const ClearancesEditor = ({ data, onChange }) => {
  const [form, setForm] = useState({ level: '', status: '', investigationDate: '', expirationDate: '' });

  const saveEntry = () => {
    if (!form.level || !form.status) return;
    onChange([...data, form]);
    setForm({ level: '', status: '', investigationDate: '', expirationDate: '' });
  };

  const deleteEntry = (idx) => onChange(data.filter((_, i) => i !== idx));

  return (
    <Card>
      <SectionTitle>Security Clearances</SectionTitle>
      
      {data.map((entry, idx) => (
        <EntryCard key={idx} onDelete={() => deleteEntry(idx)}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{entry.level}</div>
          <div style={{ fontSize: 14, color: '#aaa' }}>Status: {entry.status}</div>
          {entry.investigationDate && <div style={{ fontSize: 14, color: '#aaa' }}>Investigation: {entry.investigationDate}</div>}
          {entry.expirationDate && <div style={{ fontSize: 14, color: '#aaa' }}>Expires: {entry.expirationDate}</div>}
        </EntryCard>
      ))}

      <FormBox>
        <Select label="Clearance Level" options={CLEARANCE_LEVELS} value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} />
        <Select label="Status" options={CLEARANCE_STATUS} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} />
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <MonthInput label="Investigation Date" value={form.investigationDate} onChange={e => setForm({ ...form, investigationDate: e.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <MonthInput label="Expiration Date" value={form.expirationDate} onChange={e => setForm({ ...form, expirationDate: e.target.value })} />
          </div>
        </div>
        <Button onClick={saveEntry} small>Add Clearance</Button>
      </FormBox>
    </Card>
  );
};

// UPDATED: Certifications now includes license number field
const CertificationsEditor = ({ data, onChange }) => {
  const [form, setForm] = useState({ name: '', licenseNumber: '', issuer: '', date: '', expiration: '' });

  const saveEntry = () => {
    if (!form.name) return;
    onChange([...data, form]);
    setForm({ name: '', licenseNumber: '', issuer: '', date: '', expiration: '' });
  };

  const deleteEntry = (idx) => onChange(data.filter((_, i) => i !== idx));

  return (
    <Card>
      <SectionTitle>Certifications / Licenses</SectionTitle>
      
      {data.map((entry, idx) => (
        <EntryCard key={idx} onDelete={() => deleteEntry(idx)}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{entry.name}</div>
          {entry.licenseNumber && <div style={{ fontSize: 14, color: '#8bb8e8' }}>License #: {entry.licenseNumber}</div>}
          {entry.issuer && <div style={{ fontSize: 14, color: '#aaa' }}>{entry.issuer}</div>}
          {entry.date && <div style={{ fontSize: 14, color: '#aaa' }}>Issued: {entry.date} {entry.expiration && `• Expires: ${entry.expiration}`}</div>}
        </EntryCard>
      ))}

      <FormBox>
        <Input label="Certification / License Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="A&P Mechanic License, AWS Solutions Architect, etc." />
        <Input label="License / Certificate Number (optional)" value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} placeholder="1234567" />
        <Input label="Issuing Organization" value={form.issuer} onChange={e => setForm({ ...form, issuer: e.target.value })} placeholder="FAA, Amazon Web Services, etc." />
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <MonthInput label="Date Issued" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <MonthInput label="Expiration (optional)" value={form.expiration} onChange={e => setForm({ ...form, expiration: e.target.value })} />
          </div>
        </div>
        <Button onClick={saveEntry} small>+ Add Certification / License</Button>
      </FormBox>
    </Card>
  );
};

const SimpleListEditor = ({ title, data, onChange, fields }) => {
  const emptyForm = fields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {});
  const [form, setForm] = useState(emptyForm);

  const saveEntry = () => {
    if (!form[fields[0].key]) return;
    onChange([...data, form]);
    setForm(emptyForm);
  };

  const deleteEntry = (idx) => onChange(data.filter((_, i) => i !== idx));

  return (
    <Card>
      <SectionTitle>{title}</SectionTitle>
      
      {data.map((entry, idx) => (
        <EntryCard key={idx} onDelete={() => deleteEntry(idx)}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{entry[fields[0].key]}</div>
          {fields.slice(1).map(f => entry[f.key] && <div key={f.key} style={{ fontSize: 14, color: '#aaa' }}>{entry[f.key]}</div>)}
        </EntryCard>
      ))}

      <FormBox>
        {fields.map(f => <Input key={f.key} label={f.label} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} />)}
        <Button onClick={saveEntry} small>+ Add {title.split(' ')[0]}</Button>
      </FormBox>
    </Card>
  );
};

const ReferencesEditor = ({ data, onChange }) => {
  const [form, setForm] = useState({ name: '', title: '', company: '', phone: '', email: '', relationship: '' });

  const saveEntry = () => {
    if (!form.name) return;
    onChange({ ...data, list: [...data.list, form] });
    setForm({ name: '', title: '', company: '', phone: '', email: '', relationship: '' });
  };

  const deleteEntry = (idx) => onChange({ ...data, list: data.list.filter((_, i) => i !== idx) });

  return (
    <Card>
      <SectionTitle>References</SectionTitle>
      
      <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, cursor: 'pointer', marginBottom: 16 }}>
        <input type="checkbox" style={{ width: 22, height: 22, accentColor: '#4a90e2' }} checked={data.available} onChange={e => onChange({ ...data, available: e.target.checked })} />
        "Available upon request" (hides individual references)
      </label>

      {!data.available && (
        <>
          {data.list.map((entry, idx) => (
            <EntryCard key={idx} onDelete={() => deleteEntry(idx)}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{entry.name}</div>
              <div style={{ fontSize: 14, color: '#aaa' }}>{entry.title} at {entry.company}</div>
              <div style={{ fontSize: 14, color: '#aaa' }}>{entry.phone} • {entry.email}</div>
            </EntryCard>
          ))}

          <FormBox>
            <Input label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" />
            <Input label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Senior Manager" />
            <Input label="Company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Tech Corp" />
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Input label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" />
              </div>
              <div style={{ flex: 1 }}>
                <Input label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@email.com" />
              </div>
            </div>
            <Input label="Relationship" value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value })} placeholder="Former Supervisor" />
            <Button onClick={saveEntry} small>+ Add Reference</Button>
          </FormBox>
        </>
      )}
    </Card>
  );
};

// Plain Text Generator
const generatePlainText = (sections, data) => {
  let text = '';
  
  if (sections.contact?.enabled && data.contact?.name) {
    text += `${data.contact.name.toUpperCase()}\n`;
    const contactParts = [data.contact.email, data.contact.phone, data.contact.city && data.contact.state ? `${data.contact.city}, ${data.contact.state}` : ''].filter(Boolean);
    if (contactParts.length) text += contactParts.join(' | ') + '\n';
    text += '\n';
  }

  if (sections.summary?.enabled && data.summary) {
    text += `SUMMARY\n${data.summary}\n\n`;
  }

  if (sections.experience?.enabled && data.experience?.length) {
    text += `WORK EXPERIENCE\n`;
    data.experience.forEach(exp => {
      text += `${exp.title} | ${exp.company}\n`;
      text += `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}\n`;
      if (exp.bullets?.length) exp.bullets.forEach(b => text += `• ${b}\n`);
      text += '\n';
    });
  }

  if (sections.education?.enabled && data.education?.length) {
    text += `EDUCATION\n`;
    data.education.forEach(edu => {
      text += `${edu.degree}${edu.field ? ` in ${edu.field}` : ''} | ${edu.school}\n`;
      text += `${edu.graduationDate}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}\n\n`;
    });
  }

  if (sections.skills?.enabled && data.skills) {
    const hasSkills = data.skills.technical?.length || data.skills.soft?.length || data.skills.industry?.length;
    if (hasSkills) {
      text += `SKILLS\n`;
      if (data.skills.technical?.length) text += `Technical: ${data.skills.technical.join(', ')}\n`;
      if (data.skills.soft?.length) text += `Soft Skills: ${data.skills.soft.join(', ')}\n`;
      if (data.skills.industry?.length) text += `Industry: ${data.skills.industry.join(', ')}\n`;
      text += '\n';
    }
  }

  if (sections.certifications?.enabled && data.certifications?.length) {
    text += `CERTIFICATIONS / LICENSES\n`;
    data.certifications.forEach(cert => {
      text += `${cert.name}`;
      if (cert.licenseNumber) text += ` | License #: ${cert.licenseNumber}`;
      if (cert.issuer) text += ` | ${cert.issuer}`;
      if (cert.date) text += ` | ${cert.date}`;
      text += '\n';
    });
    text += '\n';
  }

  if (sections.clearances?.enabled && data.clearances?.length) {
    text += `SECURITY CLEARANCES\n`;
    data.clearances.forEach(cl => {
      text += `${cl.level} | ${cl.status}${cl.expirationDate ? ` | Expires: ${cl.expirationDate}` : ''}\n`;
    });
    text += '\n';
  }

  if (sections.military?.enabled && data.military?.length) {
    text += `MILITARY SERVICE\n`;
    data.military.forEach(m => text += `${m.branch} | ${m.rank} | ${m.dates}\n`);
    text += '\n';
  }

  if (sections.languages?.enabled && data.languages?.length) {
    text += `LANGUAGES\n`;
    data.languages.forEach(l => text += `${l.language} - ${l.proficiency}\n`);
    text += '\n';
  }

  if (sections.awards?.enabled && data.awards?.length) {
    text += `AWARDS & HONORS\n`;
    data.awards.forEach(a => text += `${a.award}${a.date ? ` | ${a.date}` : ''}\n`);
    text += '\n';
  }

  if (sections.references?.enabled) {
    if (data.references?.available) {
      text += `REFERENCES\nAvailable upon request\n`;
    } else if (data.references?.list?.length) {
      text += `REFERENCES\n`;
      data.references.list.forEach(r => {
        text += `${r.name} | ${r.title} at ${r.company}\n`;
        text += `${r.phone} | ${r.email}\n\n`;
      });
    }
  }

  return text.trim();
};

// Preview Content Component (reusable for both thumbnail and fullscreen)
const ResumePreviewContent = ({ sections, data, scale = 1 }) => {
  const contact = data?.contact || {};
  const hasContact = sections?.contact?.enabled && contact.name;
  
  return (
    <div style={{ background: '#fff', color: '#000', padding: 24 * scale, fontFamily: "'Times New Roman', Georgia, serif", fontSize: 12 * scale, lineHeight: 1.5 }}>
      {hasContact && (
        <>
          <div style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 }}>{contact.name}</div>
          <div style={{ textAlign: 'center', fontSize: 11, color: '#444', marginBottom: 16 }}>
            {[contact.email, contact.phone, contact.city && contact.state ? `${contact.city}, ${contact.state}` : ''].filter(Boolean).join(' | ')}
          </div>
        </>
      )}

      {sections?.summary?.enabled && data?.summary && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', borderBottom: '1px solid #000', marginBottom: 8, paddingBottom: 2, textTransform: 'uppercase' }}>Summary</div>
          <p style={{ margin: 0 }}>{data.summary}</p>
        </div>
      )}

      {sections?.experience?.enabled && data?.experience?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', borderBottom: '1px solid #000', marginBottom: 8, paddingBottom: 2, textTransform: 'uppercase' }}>Work Experience</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <strong>{exp.title}</strong> | {exp.company}<br/>
              <em>{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</em>
              {exp.bullets?.length > 0 && (
                <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                  {exp.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {sections?.education?.enabled && data?.education?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', borderBottom: '1px solid #000', marginBottom: 8, paddingBottom: 2, textTransform: 'uppercase' }}>Education</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <strong>{edu.degree} {edu.field && `in ${edu.field}`}</strong> | {edu.school}<br/>
              <em>{edu.graduationDate}{edu.gpa && ` | GPA: ${edu.gpa}`}</em>
            </div>
          ))}
        </div>
      )}

      {sections?.skills?.enabled && (data?.skills?.technical?.length > 0 || data?.skills?.soft?.length > 0 || data?.skills?.industry?.length > 0) && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', borderBottom: '1px solid #000', marginBottom: 8, paddingBottom: 2, textTransform: 'uppercase' }}>Skills</div>
          {data.skills.technical?.length > 0 && <p style={{ margin: '4px 0' }}><strong>Technical:</strong> {data.skills.technical.join(', ')}</p>}
          {data.skills.soft?.length > 0 && <p style={{ margin: '4px 0' }}><strong>Soft Skills:</strong> {data.skills.soft.join(', ')}</p>}
          {data.skills.industry?.length > 0 && <p style={{ margin: '4px 0' }}><strong>Industry:</strong> {data.skills.industry.join(', ')}</p>}
        </div>
      )}

      {sections?.certifications?.enabled && data?.certifications?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', borderBottom: '1px solid #000', marginBottom: 8, paddingBottom: 2, textTransform: 'uppercase' }}>Certifications / Licenses</div>
          {data.certifications.map((cert, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <strong>{cert.name}</strong>
              {cert.licenseNumber && <span style={{ color: '#444' }}> | License #: {cert.licenseNumber}</span>}
              {cert.issuer && ` | ${cert.issuer}`}
              {cert.date && ` | ${cert.date}`}
            </div>
          ))}
        </div>
      )}

      {sections?.clearances?.enabled && data?.clearances?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', borderBottom: '1px solid #000', marginBottom: 8, paddingBottom: 2, textTransform: 'uppercase' }}>Security Clearances</div>
          {data.clearances.map((cl, i) => (
            <div key={i}>{cl.level} - {cl.status}{cl.expirationDate && ` (Expires: ${cl.expirationDate})`}</div>
          ))}
        </div>
      )}

      {sections?.military?.enabled && data?.military?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', borderBottom: '1px solid #000', marginBottom: 8, paddingBottom: 2, textTransform: 'uppercase' }}>Military Service</div>
          {data.military.map((m, i) => (
            <div key={i}>{m.branch} | {m.rank} | {m.dates}</div>
          ))}
        </div>
      )}

      {sections?.volunteer?.enabled && data?.volunteer?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', borderBottom: '1px solid #000', marginBottom: 8, paddingBottom: 2, textTransform: 'uppercase' }}>Volunteer Experience</div>
          {data.volunteer.map((v, i) => (
            <div key={i}>{v.organization} | {v.role} | {v.dates}</div>
          ))}
        </div>
      )}

      {sections?.languages?.enabled && data?.languages?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', borderBottom: '1px solid #000', marginBottom: 8, paddingBottom: 2, textTransform: 'uppercase' }}>Languages</div>
          {data.languages.map((l, i) => (
            <div key={i}>{l.language} - {l.proficiency}</div>
          ))}
        </div>
      )}

      {sections?.awards?.enabled && data?.awards?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', borderBottom: '1px solid #000', marginBottom: 8, paddingBottom: 2, textTransform: 'uppercase' }}>Awards & Honors</div>
          {data.awards.map((a, i) => (
            <div key={i}>{a.award}{a.issuer && ` | ${a.issuer}`}{a.date && ` | ${a.date}`}</div>
          ))}
        </div>
      )}

      {sections?.references?.enabled && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', borderBottom: '1px solid #000', marginBottom: 8, paddingBottom: 2, textTransform: 'uppercase' }}>References</div>
          {data?.references?.available ? (
            <em>Available upon request</em>
          ) : data?.references?.list?.length > 0 ? (
            data.references.list.map((r, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <strong>{r.name}</strong> | {r.title} at {r.company}<br/>
                {r.phone} | {r.email}
              </div>
            ))
          ) : null}
        </div>
      )}

      {/* Empty state message */}
      {!hasContact && !data?.experience?.length && !data?.education?.length && (
        <div style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', padding: 40 }}>
          No data entered yet. Fill out the sections to see your resume preview.
        </div>
      )}
    </div>
  );
};

// Thumbnail Preview with tap-to-expand
const ResumePreview = ({ sections, data, onExpand }) => (
  <div 
    onClick={onExpand}
    style={{ 
      borderRadius: 8, 
      overflow: 'hidden', 
      maxHeight: '50vh', 
      overflowY: 'auto',
      cursor: 'pointer',
      position: 'relative',
      border: '1px solid rgba(255,255,255,0.1)',
    }}
  >
    <ResumePreviewContent sections={sections} data={data} />
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
      padding: '40px 16px 16px',
      textAlign: 'center',
      pointerEvents: 'none',
    }}>
      <span style={{ 
        background: 'rgba(74, 144, 226, 0.9)', 
        padding: '8px 16px', 
        borderRadius: 20, 
        fontSize: 13,
        fontWeight: 500,
      }}>
        👆 Tap to view full resume
      </span>
    </div>
  </div>
);

// ATS Keyword Analyzer Component
const ATSAnalyzer = ({ resumeData, sections, jobDescription, setJobDescription }) => {
  const [analysis, setAnalysis] = useState(null);

  // Common words to ignore
  const STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further',
    'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
    'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'we', 'you', 'your',
    'our', 'their', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'myself', 'he',
    'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'what', 'which', 'who',
    'whom', 'if', 'about', 'up', 'down', 'out', 'off', 'over', 'any', 'both', 'each',
    'work', 'working', 'job', 'position', 'role', 'team', 'company', 'able', 'experience',
    'including', 'requirements', 'required', 'preferred', 'skills', 'years', 'year'
  ]);

  // Extract keywords from text
  const extractKeywords = (text) => {
    if (!text) return [];
    const words = text.toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !STOP_WORDS.has(word));

    // Count frequency
    const freq = {};
    words.forEach(word => {
      freq[word] = (freq[word] || 0) + 1;
    });

    // Get unique keywords sorted by frequency
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);
  };

  // Get text for each section separately
  const getSectionTexts = () => ({
    summary: resumeData.summary || '',
    experience: (resumeData.experience || []).map(exp =>
      [exp.title, exp.company, ...(exp.bullets || [])].join(' ')
    ).join(' '),
    education: (resumeData.education || []).map(edu =>
      [edu.degree, edu.field, edu.school].join(' ')
    ).join(' '),
    skills: [
      ...(resumeData.skills?.technical || []),
      ...(resumeData.skills?.soft || []),
      ...(resumeData.skills?.industry || [])
    ].join(' '),
  });

  // Get resume text
  const getResumeText = () => {
    const parts = [];
    if (resumeData.contact?.name) parts.push(resumeData.contact.name);
    if (resumeData.summary) parts.push(resumeData.summary);

    resumeData.experience?.forEach(exp => {
      parts.push(exp.title, exp.company);
      exp.bullets?.forEach(b => parts.push(b));
    });

    resumeData.education?.forEach(edu => {
      parts.push(edu.degree, edu.field, edu.school);
    });

    if (resumeData.skills) {
      parts.push(...(resumeData.skills.technical || []));
      parts.push(...(resumeData.skills.soft || []));
      parts.push(...(resumeData.skills.industry || []));
    }

    resumeData.certifications?.forEach(c => parts.push(c.name, c.issuer));

    return parts.join(' ');
  };

  // Calculate match score for a section
  const calcSectionScore = (sectionText, jobKeywords) => {
    if (!sectionText || jobKeywords.length === 0) return 0;
    const text = sectionText.toLowerCase();
    const matched = jobKeywords.filter(kw => text.includes(kw));
    return Math.round((matched.length / jobKeywords.length) * 100);
  };

  // Calculate skills-specific score - what percentage of YOUR skills match the job
  const calcSkillsScore = (skills, jobKeywords, jobDescLower) => {
    if (!skills) return 0;

    const allSkills = [
      ...(skills.technical || []),
      ...(skills.soft || []),
      ...(skills.industry || [])
    ];

    if (allSkills.length === 0 || !jobDescLower) return 0;

    // Normalize text for matching (remove hyphens, extra spaces, lowercase)
    const normalize = (text) => text.toLowerCase().replace(/[-]/g, ' ').replace(/\s+/g, ' ').trim();
    const jobTextNormalized = normalize(jobDescLower);

    // Count how many of YOUR skills appear in the job description
    let matchedSkills = 0;
    allSkills.forEach(skill => {
      const skillNormalized = normalize(skill);
      // Check if the skill appears in job description
      if (jobTextNormalized.includes(skillNormalized)) {
        matchedSkills++;
      } else {
        // Check individual words for multi-word skills (e.g., "Problem Solving" -> check "problem" and "solving")
        const words = skillNormalized.split(' ').filter(w => w.length > 2);
        // If most words from the skill appear in job desc, count as partial match
        const wordMatches = words.filter(w => jobTextNormalized.includes(w)).length;
        if (words.length > 0 && wordMatches >= Math.ceil(words.length * 0.6)) {
          matchedSkills += 0.75;
        }
      }
    });

    // Score = what percentage of YOUR skills match the job
    return Math.round((matchedSkills / allSkills.length) * 100);
  };

  const analyzeMatch = () => {
    if (!jobDescription.trim()) return;

    const jobKeywords = extractKeywords(jobDescription).slice(0, 50);
    const jobDescLower = jobDescription.toLowerCase();
    const resumeText = getResumeText().toLowerCase();
    const resumeKeywords = new Set(extractKeywords(resumeText));
    const sectionTexts = getSectionTexts();

    const matched = [];
    const missing = [];

    jobKeywords.forEach(keyword => {
      if (resumeText.includes(keyword) || resumeKeywords.has(keyword)) {
        matched.push(keyword);
      } else {
        missing.push(keyword);
      }
    });

    const score = jobKeywords.length > 0
      ? Math.round((matched.length / jobKeywords.length) * 100)
      : 0;

    // Calculate per-section scores (use improved algorithm for skills)
    const sectionScores = {
      summary: calcSectionScore(sectionTexts.summary, jobKeywords),
      experience: calcSectionScore(sectionTexts.experience, jobKeywords),
      education: calcSectionScore(sectionTexts.education, jobKeywords),
      skills: calcSkillsScore(resumeData.skills, jobKeywords, jobDescLower),
    };

    // Find lowest scoring section (only non-empty sections)
    const scoredSections = Object.entries(sectionScores)
      .filter(([key]) => {
        if (key === 'summary') return !!resumeData.summary;
        if (key === 'experience') return resumeData.experience?.length > 0;
        if (key === 'education') return resumeData.education?.length > 0;
        if (key === 'skills') return (resumeData.skills?.technical?.length || resumeData.skills?.soft?.length || resumeData.skills?.industry?.length);
        return false;
      });
    const lowestSection = scoredSections.length > 0
      ? scoredSections.reduce((a, b) => a[1] < b[1] ? a : b)[0]
      : null;

    setAnalysis({ score, matched, missing: missing.slice(0, 20), total: jobKeywords.length, sectionScores, lowestSection });
  };

  return (
    <Card>
      <SectionTitle>ATS Keyword Analyzer</SectionTitle>
      <p style={{ color: '#888', fontSize: 14, marginTop: -8, marginBottom: 16 }}>
        Paste a job description to see how well your resume matches
      </p>

      <TextArea
        label="Job Description"
        value={jobDescription}
        onChange={e => setJobDescription(e.target.value)}
        placeholder="Paste the job posting here..."
        style={{ minHeight: 150 }}
      />

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Button onClick={analyzeMatch}>Analyze Match</Button>
        {(jobDescription || analysis) && (
          <Button
            onClick={() => { setJobDescription(''); setAnalysis(null); }}
            style={{ background: 'rgba(226, 74, 74, 0.2)', flex: 'none' }}
          >
            Clear
          </Button>
        )}
      </div>

      {analysis && (
        <div style={{ marginTop: 20 }}>
          {/* Score */}
          <div style={{
            textAlign: 'center',
            padding: 24,
            background: analysis.score >= 70 ? 'rgba(74, 226, 74, 0.1)' :
                       analysis.score >= 40 ? 'rgba(226, 180, 74, 0.1)' : 'rgba(226, 74, 74, 0.1)',
            borderRadius: 12,
            marginBottom: 16,
          }}>
            <div style={{
              fontSize: 48,
              fontWeight: 700,
              color: analysis.score >= 70 ? '#4ae24a' :
                     analysis.score >= 40 ? '#e2b44a' : '#e24a4a',
            }}>
              {analysis.score}%
            </div>
            <div style={{ color: '#888', fontSize: 14 }}>Keyword Match Score</div>
          </div>

          {/* Section Breakdown */}
          {analysis.sectionScores && (
            <div style={{ marginBottom: 16, padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Score by Section</div>
              {[
                { key: 'summary', label: 'Summary' },
                { key: 'experience', label: 'Experience' },
                { key: 'education', label: 'Education' },
                { key: 'skills', label: 'Skills' },
              ].map(({ key, label }) => {
                const sectionScore = analysis.sectionScores[key];
                const barColor = sectionScore >= 50 ? '#4ae24a' : sectionScore >= 25 ? '#e2b44a' : '#e24a4a';
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 80, fontSize: 13, color: '#aaa' }}>{label}</div>
                    <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${sectionScore}%`, height: '100%', background: barColor, borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ width: 36, fontSize: 12, color: barColor, textAlign: 'right' }}>{sectionScore}%</div>
                  </div>
                );
              })}
              {analysis.lowestSection && (
                <div style={{ marginTop: 12, padding: 10, background: 'rgba(226, 180, 74, 0.1)', borderRadius: 8, fontSize: 13, color: '#e2b44a' }}>
                  <strong>Tip:</strong> Your <strong style={{ textTransform: 'capitalize' }}>{analysis.lowestSection}</strong> section has the fewest keyword matches. Consider adding more relevant terms there.
                </div>
              )}
            </div>
          )}

          {/* Matched keywords */}
          {analysis.matched.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#4ae24a', marginBottom: 8 }}>
                Matched Keywords ({analysis.matched.length})
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {analysis.matched.map((kw, i) => (
                  <span key={i} style={{
                    padding: '4px 10px',
                    background: 'rgba(74, 226, 74, 0.2)',
                    borderRadius: 12,
                    fontSize: 12,
                    color: '#4ae24a',
                  }}>{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* Missing keywords */}
          {analysis.missing.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#e2b44a', marginBottom: 8 }}>
                Consider Adding ({analysis.missing.length})
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {analysis.missing.map((kw, i) => (
                  <span key={i} style={{
                    padding: '4px 10px',
                    background: 'rgba(226, 180, 74, 0.2)',
                    borderRadius: 12,
                    fontSize: 12,
                    color: '#e2b44a',
                  }}>{kw}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

// Cover Letter Templates
// Note: Templates generate body content only. Greeting and closing are added by preview/export functions.
const COVER_LETTER_TEMPLATES = {
  professional: {
    name: 'Professional',
    generate: (data, job) => `I am writing to express my strong interest in the ${job.title || '[Position]'} position at ${job.company || '[Company]'}. With my background as a ${data.experience?.[0]?.title || '[your field]'} and proven track record of success, I am confident I would be a valuable addition to your team.

${data.experience?.[0] ? `In my role as ${data.experience[0].title} at ${data.experience[0].company}, I ${data.experience[0].bullets?.[0]?.toLowerCase() || 'contributed significantly to the organization'}.` : 'Throughout my career, I have developed strong skills that align with this position.'}

${data.skills?.technical?.length ? `My technical expertise includes ${data.skills.technical.slice(0, 5).join(', ')}, which I believe aligns well with your requirements.` : ''}

I am excited about the opportunity to bring my skills and experience to ${job.company || 'your organization'}. I would welcome the chance to discuss how I can contribute to your team's success.

Thank you for considering my application.`
  },
  enthusiastic: {
    name: 'Enthusiastic',
    generate: (data, job) => `I was thrilled to discover the ${job.title || '[Position]'} opening at ${job.company || '[Company]'}! This role perfectly matches my passion for ${data.experience?.[0]?.title?.toLowerCase() || 'this field'} and my career aspirations.

${data.summary ? data.summary : `With experience as a ${data.experience?.[0]?.title || 'professional'}, I bring both expertise and enthusiasm to every project I undertake.`}

What excites me most about this opportunity is the chance to contribute to ${job.company || 'an innovative organization'} while continuing to grow professionally. ${data.skills?.technical?.length ? `I am particularly eager to apply my skills in ${data.skills.technical.slice(0, 3).join(' and ')}.` : ''}

I would love the opportunity to discuss how my background and drive can benefit your team. Thank you for your time and consideration!`
  },
  concise: {
    name: 'Concise',
    generate: (data, job) => `I am applying for the ${job.title || '[Position]'} role at ${job.company || '[Company]'}.

Key qualifications:
${data.experience?.[0] ? `• ${data.experience[0].title} at ${data.experience[0].company}` : '• Relevant professional experience'}
${data.education?.[0] ? `• ${data.education[0].degree} from ${data.education[0].school}` : ''}
${data.skills?.technical?.length ? `• Skills: ${data.skills.technical.slice(0, 4).join(', ')}` : ''}
${data.certifications?.[0] ? `• ${data.certifications[0].name}` : ''}

I am available for an interview at your convenience.`
  }
};

// Cover Letter Editor Component
const CoverLetterEditor = ({ resumeData, coverLetters, onSave, onDelete }) => {
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [jobInfo, setJobInfo] = useState({ company: '', title: '', hiringManager: '' });
  const [content, setContent] = useState('');
  const [letterName, setLetterName] = useState('');
  const [viewMode, setViewMode] = useState('edit'); // 'edit' or 'preview'

  const generateFromTemplate = (templateKey) => {
    const template = COVER_LETTER_TEMPLATES[templateKey];
    if (template) {
      const generated = template.generate(resumeData, jobInfo);
      setContent(generated);
      setLetterName(`${jobInfo.company || 'New'} - ${jobInfo.title || 'Cover Letter'}`);
    }
  };

  const saveLetter = () => {
    if (!content.trim()) return;
    const letter = {
      id: selectedLetter?.id || Date.now(),
      name: letterName || `Cover Letter ${new Date().toLocaleDateString()}`,
      company: jobInfo.company,
      position: jobInfo.title,
      content,
      createdAt: selectedLetter?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onSave(letter);
    setSelectedLetter(null);
    setContent('');
    setJobInfo({ company: '', title: '', hiringManager: '' });
    setLetterName('');
  };

  const loadLetter = (letter) => {
    setSelectedLetter(letter);
    setContent(letter.content);
    setLetterName(letter.name);
    setJobInfo({ company: letter.company || '', title: letter.position || '', hiringManager: '' });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    alert('Cover letter copied to clipboard!');
  };

  const exportCoverLetterDocx = async () => {
    if (!content) {
      alert('Please create a cover letter first');
      return;
    }
    try {
      const { Document, Packer, Paragraph, TextRun } = await import('docx');
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Sender info
            ...(resumeData.contact?.name ? [
              new Paragraph({ children: [new TextRun({ text: resumeData.contact.name, bold: true })] }),
              ...(resumeData.contact.email ? [new Paragraph({ children: [new TextRun(resumeData.contact.email)] })] : []),
              ...(resumeData.contact.phone ? [new Paragraph({ children: [new TextRun(resumeData.contact.phone)] })] : []),
              new Paragraph({ children: [] }),
            ] : []),
            // Date
            new Paragraph({ children: [new TextRun(today)] }),
            new Paragraph({ children: [] }),
            // Recipient
            ...(jobInfo.hiringManager ? [new Paragraph({ children: [new TextRun(jobInfo.hiringManager)] })] : []),
            ...(jobInfo.company ? [new Paragraph({ children: [new TextRun(jobInfo.company)] })] : []),
            new Paragraph({ children: [] }),
            // Salutation
            new Paragraph({ children: [new TextRun(`Dear ${jobInfo.hiringManager || 'Hiring Manager'},`)] }),
            new Paragraph({ children: [] }),
            // Body paragraphs
            ...content.split('\n\n').map(para =>
              new Paragraph({ children: [new TextRun(para.trim())] })
            ),
            new Paragraph({ children: [] }),
            // Closing
            new Paragraph({ children: [new TextRun('Sincerely,')] }),
            new Paragraph({ children: [] }),
            new Paragraph({ children: [new TextRun({ text: resumeData.contact?.name || '', bold: true })] }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${letterName || 'cover-letter'}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Export failed. Please try again.');
    }
  };

  const printCoverLetter = () => {
    if (!content) {
      alert('Please create a cover letter first');
      return;
    }
    const printWindow = window.open('', '_blank');
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cover Letter</title>
        <style>
          body { font-family: 'Times New Roman', Georgia, serif; font-size: 12pt; line-height: 1.5; max-width: 7in; margin: 0.5in auto; color: #000; }
          .sender { margin-bottom: 24pt; }
          .sender-name { font-weight: bold; }
          .date { margin-bottom: 24pt; }
          .recipient { margin-bottom: 24pt; }
          .salutation { margin-bottom: 12pt; }
          .body p { margin-bottom: 12pt; text-align: justify; }
          .closing { margin-top: 24pt; }
          .signature { margin-top: 36pt; font-weight: bold; }
        </style>
      </head>
      <body>
        ${resumeData.contact?.name ? `
        <div class="sender">
          <div class="sender-name">${resumeData.contact.name}</div>
          ${resumeData.contact.email ? `<div>${resumeData.contact.email}</div>` : ''}
          ${resumeData.contact.phone ? `<div>${resumeData.contact.phone}</div>` : ''}
        </div>
        ` : ''}
        <div class="date">${today}</div>
        <div class="recipient">
          ${jobInfo.hiringManager ? `<div>${jobInfo.hiringManager}</div>` : ''}
          ${jobInfo.company ? `<div>${jobInfo.company}</div>` : ''}
        </div>
        <div class="salutation">Dear ${jobInfo.hiringManager || 'Hiring Manager'},</div>
        <div class="body">
          ${content.split('\n\n').map(p => `<p>${p.trim()}</p>`).join('')}
        </div>
        <div class="closing">Sincerely,</div>
        <div class="signature">${resumeData.contact?.name || ''}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <>
      <Card style={{ background: 'rgba(74, 144, 226, 0.08)', border: '1px solid rgba(74, 144, 226, 0.2)' }}>
        <SectionTitle>Saved Cover Letters ({coverLetters.length})</SectionTitle>
        {coverLetters.length === 0 ? (
          <p style={{ color: '#888', fontSize: 14, textAlign: 'center', padding: 20 }}>
            No saved letters yet. Create one below and tap "Save Letter".
          </p>
        ) : (
          coverLetters.map(letter => (
            <div key={letter.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 12,
              background: selectedLetter?.id === letter.id ? 'rgba(74, 144, 226, 0.3)' : 'rgba(0,0,0,0.2)',
              borderRadius: 8,
              marginBottom: 8,
              cursor: 'pointer',
              border: selectedLetter?.id === letter.id ? '1px solid #4a90e2' : '1px solid transparent',
            }} onClick={() => loadLetter(letter)}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{letter.name}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{new Date(letter.updatedAt).toLocaleDateString()}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onDelete(letter.id); }}
                style={{ background: 'none', border: 'none', color: '#e24a4a', cursor: 'pointer', fontSize: 18, padding: 8 }}>×</button>
            </div>
          ))
        )}
      </Card>

      <Card>
        <SectionTitle>Job Details</SectionTitle>
        <p style={{ color: '#888', fontSize: 14, marginTop: -8, marginBottom: 16 }}>
          Enter details for your cover letter
        </p>
        <Input label="Company Name" value={jobInfo.company} onChange={e => setJobInfo({ ...jobInfo, company: e.target.value })} placeholder="Acme Corporation" />
        <Input label="Position Title" value={jobInfo.title} onChange={e => setJobInfo({ ...jobInfo, title: e.target.value })} placeholder="Software Engineer" />
        <Input label="Hiring Manager (optional)" value={jobInfo.hiringManager} onChange={e => setJobInfo({ ...jobInfo, hiringManager: e.target.value })} placeholder="Jane Smith" />
      </Card>

      <Card>
        <SectionTitle>Generate from Template</SectionTitle>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.entries(COVER_LETTER_TEMPLATES).map(([key, template]) => (
            <Button key={key} small variant="secondary" onClick={() => generateFromTemplate(key)}>
              {template.name}
            </Button>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <SectionTitle style={{ marginBottom: 0 }}>Cover Letter Content</SectionTitle>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 8, overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('edit')}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: viewMode === 'edit' ? '#4a90e2' : 'transparent',
                color: '#fff',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >Edit</button>
            <button
              onClick={() => setViewMode('preview')}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: viewMode === 'preview' ? '#4a90e2' : 'transparent',
                color: '#fff',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >Preview</button>
          </div>
        </div>

        {viewMode === 'edit' ? (
          <>
            <Input label="Letter Name" value={letterName} onChange={e => setLetterName(e.target.value)} placeholder="Acme Corp - Software Engineer" />
            <TextArea
              label="Content"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write or generate your cover letter..."
              style={{ minHeight: 300 }}
            />
          </>
        ) : (
          <div style={{
            background: '#fff',
            color: '#000',
            padding: '48px 40px',
            borderRadius: 4,
            minHeight: 400,
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 14,
            lineHeight: 1.6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            {/* Sender Info */}
            {resumeData.contact && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 600 }}>{resumeData.contact.name}</div>
                {resumeData.contact.email && <div>{resumeData.contact.email}</div>}
                {resumeData.contact.phone && <div>{resumeData.contact.phone}</div>}
                {resumeData.contact.location && <div>{resumeData.contact.location}</div>}
              </div>
            )}

            {/* Date */}
            <div style={{ marginBottom: 24 }}>
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

            {/* Recipient */}
            {(jobInfo.hiringManager || jobInfo.company) && (
              <div style={{ marginBottom: 24 }}>
                {jobInfo.hiringManager && <div>{jobInfo.hiringManager}</div>}
                {jobInfo.company && <div>{jobInfo.company}</div>}
              </div>
            )}

            {/* Salutation */}
            <div style={{ marginBottom: 16 }}>
              Dear {jobInfo.hiringManager || 'Hiring Manager'},
            </div>

            {/* Body */}
            <div style={{ whiteSpace: 'pre-wrap', marginBottom: 24 }}>
              {content || 'Your cover letter content will appear here...'}
            </div>

            {/* Closing */}
            <div>
              <div>Sincerely,</div>
              <div style={{ marginTop: 24, fontWeight: 600 }}>{resumeData.contact?.name || 'Your Name'}</div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Button onClick={saveLetter} style={{ flex: 1 }}>Save</Button>
          <Button variant="secondary" onClick={copyToClipboard} style={{ flex: 1 }}>Copy</Button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button variant="secondary" onClick={exportCoverLetterDocx} style={{ flex: 1 }}>Word (.docx)</Button>
          <Button variant="secondary" onClick={printCoverLetter} style={{ flex: 1 }}>PDF (Print)</Button>
        </div>
      </Card>
    </>
  );
};

// Install Banner Component
const InstallBanner = ({ onInstall, onDismiss }) => (
  <div style={{
    position: 'fixed',
    bottom: 70,
    left: 12,
    right: 12,
    background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    zIndex: 999,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  }}>
    <div style={{
      width: 48,
      height: 48,
      background: 'rgba(255,255,255,0.2)',
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 24,
    }}>
      +
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 600, fontSize: 15, color: '#fff' }}>Install Resume Builder</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Add to home screen for offline access</div>
    </div>
    <button
      onClick={onInstall}
      style={{
        background: '#fff',
        color: '#4a90e2',
        border: 'none',
        padding: '10px 16px',
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 14,
        cursor: 'pointer',
      }}
    >
      Install
    </button>
    <button
      onClick={onDismiss}
      style={{
        background: 'transparent',
        border: 'none',
        color: 'rgba(255,255,255,0.7)',
        fontSize: 20,
        cursor: 'pointer',
        padding: '4px 8px',
      }}
    >
      x
    </button>
  </div>
);

// Device Storage Panel
const DeviceStoragePanel = ({ files, onLoad, onDelete, onClear, onClose }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.95)',
    zIndex: 1000,
    overflow: 'auto',
    padding: '20px',
  }}>
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: '#fff' }}>Device Storage</h2>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            width: 40,
            height: 40,
            borderRadius: 20,
            fontSize: 20,
            cursor: 'pointer',
          }}
        >
          x
        </button>
      </div>

      <div style={{
        background: 'rgba(74, 144, 226, 0.1)',
        border: '1px solid rgba(74, 144, 226, 0.3)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        fontSize: 13,
        color: '#8bb8e8'
      }}>
        Simulated phone storage for testing import/export. Files persist in browser localStorage.
      </div>

      {files.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 40,
          color: '#666',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>[]</div>
          <div>No saved files</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>Save a resume from the Export screen</div>
        </div>
      ) : (
        <>
          {files.map(file => (
            <div key={file.id} style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    {new Date(file.savedAt).toLocaleDateString()} at {new Date(file.savedAt).toLocaleTimeString()}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => onLoad(file)}
                    style={{
                      background: '#4a90e2',
                      border: 'none',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    Load
                  </button>
                  <button
                    onClick={() => onDelete(file.id)}
                    style={{
                      background: 'rgba(226, 74, 74, 0.2)',
                      border: '1px solid rgba(226, 74, 74, 0.3)',
                      color: '#e24a4a',
                      padding: '8px 12px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    x
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={onClear}
            style={{
              width: '100%',
              padding: 12,
              background: 'rgba(226, 74, 74, 0.1)',
              border: '1px solid rgba(226, 74, 74, 0.3)',
              color: '#e24a4a',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              marginTop: 12,
            }}
          >
            Clear All Device Storage
          </button>
        </>
      )}

      <div style={{
        marginTop: 20,
        padding: 16,
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        fontSize: 12,
        color: '#666'
      }}>
        Storage used: {files.length} file(s) | ~{(JSON.stringify(files).length / 1024).toFixed(1)} KB
      </div>
    </div>
  </div>
);

// Fullscreen Preview Modal
const FullscreenPreview = ({ sections, data, onClose }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.95)',
    zIndex: 1000,
    overflow: 'auto',
    padding: '60px 0 20px',
  }}>
    <button 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 12,
        right: 12,
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        color: '#fff',
        width: 44,
        height: 44,
        borderRadius: 22,
        fontSize: 24,
        cursor: 'pointer',
        zIndex: 1001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      ×
    </button>
    <div style={{
      maxWidth: 650,
      margin: '0 auto',
      padding: '0 12px',
    }}>
      <div style={{ borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        <ResumePreviewContent sections={sections} data={data} />
      </div>
    </div>
  </div>
);

// Collapsible Section Component
const Collapsible = ({ title, children, defaultOpen = false }) => (
  <details open={defaultOpen} style={{ marginBottom: 12 }}>
    <summary style={{ cursor: 'pointer', padding: '12px 16px', background: 'rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontWeight: 500, listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {title}
      <span style={{ fontSize: 12, opacity: 0.6 }}>tap to expand</span>
    </summary>
    <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '0 0 8px 8px', marginTop: -4 }}>
      {children}
    </div>
  </details>
);

// Welcome Back Modal - prompt user about saved data
const WelcomeBackModal = ({ savedData, onContinue, onStartFresh }) => {
  const contactName = savedData?.data?.contact?.name;
  const expCount = savedData?.data?.experience?.length || 0;
  const skillCount = (savedData?.data?.skills?.technical?.length || 0) +
                     (savedData?.data?.skills?.soft?.length || 0) +
                     (savedData?.data?.skills?.industry?.length || 0);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#1a1a2e',
        borderRadius: 16,
        maxWidth: 400,
        width: '100%',
        padding: 24,
        border: '1px solid rgba(74, 144, 226, 0.3)',
      }}>
        <h2 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: 22 }}>Welcome Back!</h2>
        <p style={{ color: '#aaa', fontSize: 14, marginBottom: 16 }}>
          We found a previously saved resume. Would you like to continue where you left off?
        </p>

        {/* Summary of saved data */}
        <div style={{
          background: 'rgba(74, 144, 226, 0.1)',
          borderRadius: 10,
          padding: 12,
          marginBottom: 20,
          border: '1px solid rgba(74, 144, 226, 0.2)'
        }}>
          <div style={{ fontSize: 13, color: '#8bb8e8', marginBottom: 8 }}>Saved resume contains:</div>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#ccc', fontSize: 13 }}>
            {contactName && <li>Name: {contactName}</li>}
            {expCount > 0 && <li>{expCount} work experience{expCount > 1 ? 's' : ''}</li>}
            {skillCount > 0 && <li>{skillCount} skill{skillCount > 1 ? 's' : ''}</li>}
          </ul>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onStartFresh}
            style={{
              flex: 1,
              padding: '14px 20px',
              background: 'rgba(226, 74, 74, 0.2)',
              border: '1px solid rgba(226, 74, 74, 0.3)',
              borderRadius: 10,
              color: '#e88b8b',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Start Fresh
          </button>
          <button
            onClick={onContinue}
            style={{
              flex: 1,
              padding: '14px 20px',
              background: 'linear-gradient(135deg, #4a90e2, #357abd)',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

// Help Modal Component
const HelpModal = ({ onClose }) => {
  const checkForUpdates = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          alert('Checking for updates... If a new version is available, it will load on next refresh.');
        } else {
          alert('No service worker found. Try refreshing the page.');
        }
      } catch (err) {
        alert('Update check failed. Try refreshing the page.');
      }
    } else {
      alert('Service workers not supported in this browser.');
    }
  };

  return (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.95)',
    zIndex: 1001,
    overflow: 'auto',
    padding: '20px',
  }}>
    <div style={{ maxWidth: 600, margin: '0 auto', fontSize: 14, lineHeight: 1.6, color: '#ccc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: '#fff' }}>Help & Info</h2>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: 40, height: 40, borderRadius: 20, fontSize: 20, cursor: 'pointer' }}>×</button>
      </div>

      <button
        onClick={checkForUpdates}
        style={{ width: '100%', padding: 12, marginBottom: 16, background: 'rgba(74, 226, 74, 0.15)', border: '1px solid rgba(74, 226, 74, 0.3)', borderRadius: 8, color: '#4ae24a', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
      >
        🔄 Check for Updates
      </button>

      <Collapsible title="Resume Writing Tips" defaultOpen={true}>
        <p><strong style={{ color: '#4a90e2' }}>1. Tailor for Each Job</strong> - Use keywords from the job description. Our ATS Analyzer helps identify missing keywords.</p>
        <p><strong style={{ color: '#4a90e2' }}>2. Lead with Action Verbs</strong> - Led, Developed, Implemented, Achieved, Reduced, Increased, Managed, Created.</p>
        <p><strong style={{ color: '#4a90e2' }}>3. Quantify Achievements</strong> - "Reduced costs by 20%" beats "Reduced costs." Use numbers.</p>
        <p><strong style={{ color: '#4a90e2' }}>4. Keep it Concise</strong> - One page for &lt;10 years experience. Two pages max for senior roles.</p>
        <p><strong style={{ color: '#4a90e2' }}>5. ATS-Friendly Format</strong> - Standard headers, no tables/graphics. Our Word export is optimized.</p>
        <p style={{ marginBottom: 0 }}><strong style={{ color: '#4a90e2' }}>6. Proofread Everything</strong> - Spelling errors are instant disqualifiers.</p>
      </Collapsible>

      <Collapsible title="Using This App">
        <p><strong style={{ color: '#4a90e2' }}>Step 1: Select Sections</strong><br/>
        On the Build tab, check which sections you want in your resume. Common choices: Contact, Experience, Education, Skills. Add Certifications, Clearances, or References as needed.</p>

        <p><strong style={{ color: '#4a90e2' }}>Step 2: Fill In Your Info</strong><br/>
        Tap "Start Building" to go through each section. Use the progress bar at top to track where you are. Back/Next buttons navigate between sections.</p>

        <p><strong style={{ color: '#4a90e2' }}>Step 3: Preview & Optimize</strong><br/>
        Preview tab shows your resume. Tap it to see full-screen. Use the ATS Analyzer below - paste a job description to see which keywords you're missing, then go back and add them.</p>

        <p><strong style={{ color: '#4a90e2' }}>Step 4: Create Cover Letter</strong><br/>
        Letter tab lets you generate cover letters. Enter company name and position, then pick a template (Professional, Enthusiastic, or Concise). Edit the generated text to personalize it. Toggle Edit/Preview to see formatted letter.</p>

        <p><strong style={{ color: '#4a90e2' }}>Step 5: Export</strong><br/>
        Export tab has multiple options:<br/>
        • <strong>Word (.docx)</strong> - Best for job applications and ATS systems<br/>
        • <strong>PDF</strong> - Opens print dialog, choose "Save as PDF"<br/>
        • <strong>Plain Text</strong> - For copy-pasting into web forms<br/>
        • <strong>JSON</strong> - Backup your data to restore later</p>

        <p style={{ marginBottom: 0 }}><strong style={{ color: '#4a90e2' }}>Auto-Save</strong><br/>
        Your work saves automatically to your browser. To backup or transfer to another device, use Export → Save Data (.json), then Import from File on the new device.</p>
      </Collapsible>

      <Collapsible title="Privacy Policy">
        <div style={{ background: 'rgba(74, 226, 74, 0.1)', padding: 12, borderRadius: 8, marginBottom: 12, border: '1px solid rgba(74, 226, 74, 0.3)' }}>
          <strong style={{ color: '#4ae24a' }}>We collect ZERO data.</strong>
          <span style={{ color: '#8be88b' }}> Your info never leaves your device.</span>
        </div>
        <p><strong>Storage:</strong> All data stays in your browser's localStorage only.</p>
        <p><strong>No Tracking:</strong> No analytics, no cookies, no ads, no accounts.</p>
        <p><strong>Offline:</strong> Works without internet after first load.</p>
        <p><strong>Your Rights (GDPR/CCPA/PIPEDA):</strong> Nothing to request from us - you control everything locally. Export via JSON, delete via browser settings.</p>
        <p style={{ marginBottom: 0 }}><strong>Contact:</strong> <a href="https://github.com/McJuniorstein/resume-builder-pwa" target="_blank" rel="noopener noreferrer" style={{ color: '#4a90e2' }}>GitHub</a> | MIT License</p>
      </Collapsible>

      <Collapsible title="Changelog">
        <div style={{ borderLeft: '2px solid #4a90e2', paddingLeft: 12 }}>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: '#4a90e2' }}>v1.4.1</strong> <span style={{ color: '#666', fontSize: 12 }}>Jan 2026</span><br/>
            • Clickable section navigation — jump directly to any section<br/>
            • Visual indicators: current (blue), completed (green ✓), pending (gray)
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: '#4a90e2' }}>v1.4.0</strong> <span style={{ color: '#666', fontSize: 12 }}>Jan 2026</span><br/>
            • Smart aviation keyword filtering (170+ skills from 1,664 database)<br/>
            • Auto-detects aviation jobs from description (FAA, aircraft, MRO, etc.)<br/>
            • Aviation skills appear as quick picks when job context detected
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: '#4a90e2' }}>v1.3.3</strong> <span style={{ color: '#666', fontSize: 12 }}>Jan 2026</span><br/>
            • Fixed skills input focus with uncontrolled input pattern<br/>
            • Debounced suggestions (150ms) to prevent focus stealing<br/>
            • Improved suggestion matching: prefix matches shown first
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: '#4a90e2' }}>v1.3.1</strong> <span style={{ color: '#666', fontSize: 12 }}>Jan 2026</span><br/>
            • Fixed skills input losing focus while typing<br/>
            • Fixed "Welcome Back" modal not appearing on return visits<br/>
            • Improved ATS skills scoring - now shows % of your skills that match job
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: '#4a90e2' }}>v1.3.0</strong> <span style={{ color: '#666', fontSize: 12 }}>Jan 2026</span><br/>
            • Form validation for required contact fields<br/>
            • Skill suggestions with 115+ keywords and quick-pick buttons<br/>
            • ATS Analyzer section breakdown with per-section scores<br/>
            • Auto-save indicator shows when data is saved
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: '#4a90e2' }}>v1.2.0</strong> <span style={{ color: '#666', fontSize: 12 }}>Jan 2026</span><br/>
            • Cover letter generator with templates<br/>
            • Cover letter export (Word & PDF)<br/>
            • Check for Updates button
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong style={{ color: '#4a90e2' }}>v1.1.0</strong> <span style={{ color: '#666', fontSize: 12 }}>Jan 2026</span><br/>
            • ATS keyword analyzer<br/>
            • PDF print with optimized margins<br/>
            • Word (.docx) and plain text export
          </p>
        </div>
      </Collapsible>
    </div>
  </div>
  );
};

// Main App
export default function RDResumeBuilder() {
  const [view, setView] = useState('sections');
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [data, setData] = useState(DEFAULT_DATA);
  const [currentSection, setCurrentSection] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [savedFiles, setSavedFiles] = useState([]);
  const [showDeviceStorage, setShowDeviceStorage] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [coverLetters, setCoverLetters] = useState([]);
  const [showHelp, setShowHelp] = useState(null); // null, 'guide', or 'privacy'
  const [contactErrors, setContactErrors] = useState({});
  const [lastSaved, setLastSaved] = useState(null);
  const [saveVisible, setSaveVisible] = useState(false);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [pendingSavedData, setPendingSavedData] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [jobDescription, setJobDescription] = useState(''); // Lifted for smart skill filtering

  // Validate contact info before proceeding
  const validateContact = () => {
    const errors = {};
    const contact = data.contact || {};
    if (!contact.name?.trim()) errors.name = 'Full name is required';
    if (!contact.email?.trim()) errors.email = 'Email is required';
    if (!contact.city?.trim()) errors.city = 'City is required';
    if (!contact.state?.trim()) errors.state = 'State is required';
    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if saved data has meaningful content
  const hasMeaningfulData = (savedData) => {
    if (!savedData?.data) return false;
    const d = savedData.data;
    return (
      d.contact?.name?.trim() ||
      d.contact?.email?.trim() ||
      d.summary?.trim() ||
      d.experience?.length > 0 ||
      d.education?.length > 0 ||
      d.skills?.technical?.length > 0 ||
      d.skills?.soft?.length > 0 ||
      d.skills?.industry?.length > 0 ||
      d.certifications?.length > 0
    );
  };

  // Load from localStorage - show prompt if data exists
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (hasMeaningfulData(parsed)) {
          setPendingSavedData(parsed);
          setShowWelcomeBack(true);
        }
      }
    } catch (e) {
      console.error('Failed to load saved data:', e);
    }
    setInitialLoadComplete(true);
  }, []);

  // Handle continuing with saved data
  const handleContinueWithSaved = () => {
    if (pendingSavedData) {
      if (pendingSavedData.sections) setSections(prev => ({ ...prev, ...pendingSavedData.sections }));
      if (pendingSavedData.data) setData(prev => ({ ...prev, ...pendingSavedData.data }));
    }
    setPendingSavedData(null);
    setShowWelcomeBack(false);
  };

  // Handle starting fresh
  const handleStartFresh = () => {
    setSections(DEFAULT_SECTIONS);
    setData(DEFAULT_DATA);
    setPendingSavedData(null);
    setShowWelcomeBack(false);
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);
  };

  // Clear all data (for Start Fresh button)
  const clearAllData = () => {
    if (confirm('Clear all resume data and start fresh? This cannot be undone.')) {
      setSections(DEFAULT_SECTIONS);
      setData(DEFAULT_DATA);
      setCurrentSection(0);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Save to localStorage with indicator - only after initial load is complete
  useEffect(() => {
    // Don't save until initial load is complete (prevents overwriting saved data on mount)
    if (!initialLoadComplete) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sections, data }));
      setLastSaved(new Date());
      setSaveVisible(true);

      // Hide indicator after 2 seconds
      const timer = setTimeout(() => setSaveVisible(false), 2000);
      return () => clearTimeout(timer);
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }, [sections, data, initialLoadComplete]);

  // Load device storage files
  useEffect(() => {
    try {
      const files = localStorage.getItem(DEVICE_STORAGE_KEY);
      if (files) setSavedFiles(JSON.parse(files));
    } catch (e) {
      console.error('Failed to load device files:', e);
    }
  }, []);

  // Load cover letters
  useEffect(() => {
    try {
      const letters = localStorage.getItem(COVER_LETTERS_KEY);
      if (letters) setCoverLetters(JSON.parse(letters));
    } catch (e) {
      console.error('Failed to load cover letters:', e);
    }
  }, []);

  // Save cover letter
  const saveCoverLetter = (letter) => {
    const updated = [...coverLetters.filter(l => l.id !== letter.id), letter];
    setCoverLetters(updated);
    localStorage.setItem(COVER_LETTERS_KEY, JSON.stringify(updated));
    alert('Cover letter saved!');
  };

  // Delete cover letter
  const deleteCoverLetter = (id) => {
    if (confirm('Delete this cover letter?')) {
      const updated = coverLetters.filter(l => l.id !== id);
      setCoverLetters(updated);
      localStorage.setItem(COVER_LETTERS_KEY, JSON.stringify(updated));
    }
  };

  // File System Access API - native save dialog (Chrome/Edge)
  const saveWithFilePicker = async () => {
    const jsonData = JSON.stringify({ sections, data, coverLetters }, null, 2);
    const fileName = data.contact?.name
      ? `${data.contact.name.replace(/\s+/g, '_')}_resume.json`
      : 'resume_backup.json';

    // Check if File System Access API is available
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(jsonData);
        await writable.close();
        alert('Resume saved to file!');
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Save failed:', err);
        }
        return;
      }
    }
    // Fallback to regular download
    exportJson();
  };

  // File System Access API - native open dialog (Chrome/Edge)
  const openWithFilePicker = async () => {
    if ('showOpenFilePicker' in window) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] }
          }]
        });
        const file = await handle.getFile();
        const text = await file.text();
        const parsed = JSON.parse(text);

        if (parsed.sections) setSections(prev => ({ ...prev, ...parsed.sections }));
        if (parsed.data) setData(prev => ({ ...prev, ...parsed.data }));
        if (parsed.coverLetters) setCoverLetters(parsed.coverLetters);
        alert('Resume loaded from file!');
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Open failed:', err);
          alert('Failed to open file');
        }
        return;
      }
    }
    // Fallback - trigger file input
    document.getElementById('importInput')?.click();
  };

  // Save file to simulated device storage
  const saveToDevice = () => {
    const fileName = data.contact?.name
      ? `${data.contact.name.replace(/\s+/g, '_')}_resume.json`
      : `resume_${Date.now()}.json`;

    const fileData = {
      id: Date.now(),
      name: fileName,
      savedAt: new Date().toISOString(),
      size: JSON.stringify({ sections, data }).length,
      content: { sections, data }
    };

    const updatedFiles = [...savedFiles.filter(f => f.name !== fileName), fileData];
    setSavedFiles(updatedFiles);
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(updatedFiles));
    alert(`Saved to device: ${fileName}`);
  };

  // Load file from simulated device storage
  const loadFromDevice = (file) => {
    if (confirm(`Load "${file.name}"? This will replace your current data.`)) {
      if (file.content.sections) setSections(prev => ({ ...prev, ...file.content.sections }));
      if (file.content.data) setData(prev => ({ ...prev, ...file.content.data }));
      setShowDeviceStorage(false);
      alert('Resume loaded!');
    }
  };

  // Delete file from simulated device storage
  const deleteFromDevice = (fileId) => {
    if (confirm('Delete this file from device storage?')) {
      const updatedFiles = savedFiles.filter(f => f.id !== fileId);
      setSavedFiles(updatedFiles);
      localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(updatedFiles));
    }
  };

  // Clear all device storage
  const clearDeviceStorage = () => {
    if (confirm('Delete ALL saved resumes from device storage?')) {
      setSavedFiles([]);
      localStorage.removeItem(DEVICE_STORAGE_KEY);
    }
  };

  // PWA Install prompt handling
  useEffect(() => {
    const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Show banner if not previously dismissed (within last 7 days)
      if (!dismissed || Date.now() - parseInt(dismissed) > 7 * 24 * 60 * 60 * 1000) {
        setShowInstallBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setShowInstallBanner(false);
      console.log('PWA installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem(INSTALL_DISMISSED_KEY, Date.now().toString());
  };

  const enabledSections = Object.entries(sections).filter(([_, v]) => v.enabled).map(([k]) => k);

  const updateSection = (key, value) => setSections(prev => ({ ...prev, [key]: { ...prev[key], enabled: value } }));
  const updateData = (key, value) => setData(prev => ({ ...prev, [key]: value }));

  const downloadFile = (content, filename, type) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportTxt = () => {
    const text = generatePlainText(sections, data);
    downloadFile(text, `${data.contact?.name || 'resume'}.txt`, 'text/plain');
  };

  const exportJson = () => {
    const json = JSON.stringify({ sections, data }, null, 2);
    downloadFile(json, `${data.contact?.name || 'resume'}_data.json`, 'application/json');
  };

  const exportDocx = async () => {
    setExporting(true);
    try {
      const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = await import('docx');
      
      const children = [];

      if (sections.contact?.enabled && data.contact?.name) {
        children.push(new Paragraph({
          children: [new TextRun({ text: data.contact.name, bold: true, size: 32 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }));
        const contactParts = [data.contact.email, data.contact.phone, data.contact.city && data.contact.state ? `${data.contact.city}, ${data.contact.state}` : ''].filter(Boolean);
        if (contactParts.length) {
          children.push(new Paragraph({
            children: [new TextRun({ text: contactParts.join(' | '), size: 20 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }));
        }
      }

      const addHeader = (title) => {
        children.push(new Paragraph({
          children: [new TextRun({ text: title, bold: true, size: 24, allCaps: true })],
          spacing: { before: 300, after: 100 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6 } },
        }));
      };

      if (sections.summary?.enabled && data.summary) {
        addHeader('Summary');
        children.push(new Paragraph({ children: [new TextRun({ text: data.summary, size: 22 })], spacing: { after: 200 } }));
      }

      if (sections.experience?.enabled && data.experience?.length) {
        addHeader('Work Experience');
        data.experience.forEach(exp => {
          children.push(new Paragraph({
            children: [new TextRun({ text: exp.title, bold: true, size: 22 }), new TextRun({ text: ` | ${exp.company}`, size: 22 })],
            spacing: { before: 150 },
          }));
          children.push(new Paragraph({
            children: [new TextRun({ text: `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`, italics: true, size: 20 })],
            spacing: { after: 50 },
          }));
          if (exp.bullets?.length) {
            exp.bullets.forEach(bullet => {
              children.push(new Paragraph({
                children: [new TextRun({ text: bullet, size: 22 })],
                bullet: { level: 0 },
                spacing: { after: 50 },
              }));
            });
          }
        });
      }

      if (sections.education?.enabled && data.education?.length) {
        addHeader('Education');
        data.education.forEach(edu => {
          children.push(new Paragraph({
            children: [new TextRun({ text: `${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`, bold: true, size: 22 }), new TextRun({ text: ` | ${edu.school}`, size: 22 })],
          }));
          children.push(new Paragraph({
            children: [new TextRun({ text: `${edu.graduationDate}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}`, italics: true, size: 20 })],
            spacing: { after: 100 },
          }));
        });
      }

      if (sections.skills?.enabled && (data.skills?.technical?.length || data.skills?.soft?.length || data.skills?.industry?.length)) {
        addHeader('Skills');
        if (data.skills.technical?.length) children.push(new Paragraph({ children: [new TextRun({ text: 'Technical: ', bold: true, size: 22 }), new TextRun({ text: data.skills.technical.join(', '), size: 22 })] }));
        if (data.skills.soft?.length) children.push(new Paragraph({ children: [new TextRun({ text: 'Soft Skills: ', bold: true, size: 22 }), new TextRun({ text: data.skills.soft.join(', '), size: 22 })] }));
        if (data.skills.industry?.length) children.push(new Paragraph({ children: [new TextRun({ text: 'Industry: ', bold: true, size: 22 }), new TextRun({ text: data.skills.industry.join(', '), size: 22 })] }));
      }

      if (sections.certifications?.enabled && data.certifications?.length) {
        addHeader('Certifications / Licenses');
        data.certifications.forEach(cert => {
          const parts = [cert.name];
          if (cert.licenseNumber) parts.push(`License #: ${cert.licenseNumber}`);
          if (cert.issuer) parts.push(cert.issuer);
          if (cert.date) parts.push(cert.date);
          children.push(new Paragraph({ children: [new TextRun({ text: parts.join(' | '), size: 22 })], bullet: { level: 0 } }));
        });
      }

      if (sections.clearances?.enabled && data.clearances?.length) {
        addHeader('Security Clearances');
        data.clearances.forEach(cl => {
          children.push(new Paragraph({ children: [new TextRun({ text: `${cl.level} - ${cl.status}${cl.expirationDate ? ` (Expires: ${cl.expirationDate})` : ''}`, size: 22 })], bullet: { level: 0 } }));
        });
      }

      if (sections.references?.enabled) {
        addHeader('References');
        if (data.references?.available) {
          children.push(new Paragraph({ children: [new TextRun({ text: 'Available upon request', italics: true, size: 22 })] }));
        } else if (data.references?.list?.length) {
          data.references.list.forEach(r => {
            children.push(new Paragraph({ children: [new TextRun({ text: r.name, bold: true, size: 22 }), new TextRun({ text: ` | ${r.title} at ${r.company}`, size: 22 })] }));
            children.push(new Paragraph({ children: [new TextRun({ text: `${r.phone} | ${r.email}`, size: 20 })], spacing: { after: 100 } }));
          });
        }
      }

      const doc = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);
      downloadFile(blob, `${data.contact?.name || 'resume'}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    } catch (err) {
      console.error('DOCX export error:', err);
      alert('Error generating DOCX: ' + err.message);
    }
    setExporting(false);
  };

  const importJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed.sections) setSections(prev => ({ ...prev, ...parsed.sections }));
        if (parsed.data) setData(prev => ({ ...prev, ...parsed.data }));
        alert('Resume data imported!');
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const clearAll = () => {
    if (confirm('Clear all data and start fresh?')) {
      setSections(DEFAULT_SECTIONS);
      setData(DEFAULT_DATA);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const renderEditor = () => {
    const key = enabledSections[currentSection];
    if (!key) return null;
    
    switch (key) {
      case 'contact': return <ContactEditor data={data.contact} onChange={v => updateData('contact', v)} errors={contactErrors} />;
      case 'summary': return <SummaryEditor data={data.summary} onChange={v => updateData('summary', v)} />;
      case 'experience': return <ExperienceEditor data={data.experience} onChange={v => updateData('experience', v)} />;
      case 'education': return <EducationEditor data={data.education} onChange={v => updateData('education', v)} />;
      case 'skills': return <SkillsEditor data={data.skills} onChange={v => updateData('skills', v)} jobDescription={jobDescription} />;
      case 'clearances': return <ClearancesEditor data={data.clearances} onChange={v => updateData('clearances', v)} />;
      case 'certifications': return <CertificationsEditor data={data.certifications} onChange={v => updateData('certifications', v)} />;
      case 'military': return <SimpleListEditor title="Military Service" data={data.military} onChange={v => updateData('military', v)} fields={[{ key: 'branch', label: 'Branch', placeholder: 'U.S. Army' }, { key: 'rank', label: 'Rank', placeholder: 'Sergeant' }, { key: 'dates', label: 'Dates', placeholder: '2010 - 2016' }]} />;
      case 'volunteer': return <SimpleListEditor title="Volunteer Experience" data={data.volunteer} onChange={v => updateData('volunteer', v)} fields={[{ key: 'organization', label: 'Organization', placeholder: 'Habitat for Humanity' }, { key: 'role', label: 'Role', placeholder: 'Coordinator' }, { key: 'dates', label: 'Dates', placeholder: '2020 - Present' }]} />;
      case 'publications': return <SimpleListEditor title="Publications" data={data.publications} onChange={v => updateData('publications', v)} fields={[{ key: 'title', label: 'Title', placeholder: 'Paper Title' }, { key: 'publication', label: 'Publication', placeholder: 'Journal Name' }, { key: 'date', label: 'Date', placeholder: 'March 2023' }]} />;
      case 'projects': return <SimpleListEditor title="Projects" data={data.projects} onChange={v => updateData('projects', v)} fields={[{ key: 'name', label: 'Project', placeholder: 'E-commerce Platform' }, { key: 'description', label: 'Description', placeholder: 'Built a scalable...' }, { key: 'url', label: 'URL', placeholder: 'github.com/...' }]} />;
      case 'languages': return <SimpleListEditor title="Languages" data={data.languages} onChange={v => updateData('languages', v)} fields={[{ key: 'language', label: 'Language', placeholder: 'Spanish' }, { key: 'proficiency', label: 'Proficiency', placeholder: 'Professional' }]} />;
      case 'affiliations': return <SimpleListEditor title="Affiliations" data={data.affiliations} onChange={v => updateData('affiliations', v)} fields={[{ key: 'organization', label: 'Organization', placeholder: 'IEEE' }, { key: 'role', label: 'Role', placeholder: 'Member' }, { key: 'years', label: 'Years', placeholder: '2020 - Present' }]} />;
      case 'awards': return <SimpleListEditor title="Awards" data={data.awards} onChange={v => updateData('awards', v)} fields={[{ key: 'award', label: 'Award', placeholder: 'Employee of Year' }, { key: 'issuer', label: 'Issuer', placeholder: 'ABC Corp' }, { key: 'date', label: 'Date', placeholder: '2022' }]} />;
      case 'references': return <ReferencesEditor data={data.references} onChange={v => updateData('references', v)} />;
      default: return <Card><p>Unknown section: {key}</p></Card>;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: '#e8e8e8', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <header style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>R&D Resume Builder</h1>
          <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0 0' }}>ATS-Optimized Resumes</p>
        </div>
        <button
          onClick={() => setShowHelp('guide')}
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: 40, height: 40, borderRadius: 20, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Help"
        >?</button>
      </header>

      {showHelp && <HelpModal onClose={() => setShowHelp(null)} />}
      {showWelcomeBack && pendingSavedData && (
        <WelcomeBackModal
          savedData={pendingSavedData}
          onContinue={handleContinueWithSaved}
          onStartFresh={handleStartFresh}
        />
      )}

      <main style={{ padding: 20, maxWidth: 600, margin: '0 auto', paddingBottom: 100 }}>
        {view === 'sections' && (
          <>
            <Card>
              <SectionTitle>Select Resume Sections</SectionTitle>
              <p style={{ color: '#888', fontSize: 14, marginBottom: 16, marginTop: 0 }}>Choose which sections to include.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.entries(sections).map(([key, section]) => (
                  <label key={key} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    background: section.enabled ? 'rgba(74, 144, 226, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: section.enabled ? '1px solid rgba(74, 144, 226, 0.3)' : '1px solid transparent',
                    borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    <input type="checkbox" style={{ width: 22, height: 22, accentColor: '#4a90e2' }} checked={section.enabled} onChange={e => updateSection(key, e.target.checked)} />
                    {section.label}
                  </label>
                ))}
              </div>
            </Card>

            <Button onClick={() => { setCurrentSection(0); setView('edit'); }}>Start Building →</Button>

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Button variant="secondary" onClick={() => document.getElementById('importInput').click()}>Import from File (.json)</Button>
              <input type="file" id="importInput" accept=".json" onChange={importJson} style={{ display: 'none' }} />
              <Button variant="secondary" onClick={() => setShowDeviceStorage(true)}>
                Load from Device Storage {savedFiles.length > 0 && `(${savedFiles.length})`}
              </Button>
              <Button variant="danger" onClick={clearAllData}>
                Clear All Data
              </Button>
            </div>
            {showDeviceStorage && <DeviceStoragePanel files={savedFiles} onLoad={loadFromDevice} onDelete={deleteFromDevice} onClear={clearDeviceStorage} onClose={() => setShowDeviceStorage(false)} />}
          </>
        )}

        {view === 'edit' && (
          <>
            {/* Clickable Section Navigation */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 20,
              padding: '12px 0',
            }}>
              {enabledSections.map((key, idx) => {
                const isCompleted = idx < currentSection;
                const isCurrent = idx === currentSection;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      // Validate contact if leaving contact section
                      if (enabledSections[currentSection] === 'contact' && idx > currentSection && !validateContact()) {
                        return;
                      }
                      setContactErrors({});
                      setCurrentSection(idx);
                    }}
                    style={{
                      padding: '8px 14px',
                      fontSize: 13,
                      fontWeight: isCurrent ? 600 : 400,
                      background: isCurrent ? '#4a90e2' : isCompleted ? 'rgba(74, 226, 74, 0.15)' : 'rgba(255,255,255,0.08)',
                      border: isCurrent ? '2px solid #4a90e2' : isCompleted ? '1px solid rgba(74, 226, 74, 0.4)' : '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 20,
                      color: isCurrent ? '#fff' : isCompleted ? '#7be87b' : '#888',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {isCompleted && <span style={{ fontSize: 11 }}>✓</span>}
                    {sections[key]?.label}
                  </button>
                );
              })}
            </div>
            {renderEditor()}
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => currentSection === 0 ? setView('sections') : setCurrentSection(p => p - 1)}>← Back</Button>
              <Button style={{ flex: 1 }} onClick={() => {
                // Validate contact section before proceeding
                if (enabledSections[currentSection] === 'contact' && !validateContact()) {
                  return; // Don't proceed if validation fails
                }
                setContactErrors({}); // Clear errors when moving away
                if (currentSection === enabledSections.length - 1) {
                  setView('preview');
                } else {
                  setCurrentSection(p => p + 1);
                }
              }}>
                {currentSection === enabledSections.length - 1 ? 'Preview' : 'Next →'}
              </Button>
            </div>
          </>
        )}

        {view === 'preview' && (
          <>
            <Card><SectionTitle>Resume Preview</SectionTitle><ResumePreview sections={sections} data={data} onExpand={() => setShowFullPreview(true)} /></Card>
            <ATSAnalyzer resumeData={data} sections={sections} jobDescription={jobDescription} setJobDescription={setJobDescription} />
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => setView('edit')}>← Edit</Button>
              <Button style={{ flex: 1 }} onClick={() => setView('export')}>Export →</Button>
            </div>
            {showFullPreview && <FullscreenPreview sections={sections} data={data} onClose={() => setShowFullPreview(false)} />}
            {showDeviceStorage && <DeviceStoragePanel files={savedFiles} onLoad={loadFromDevice} onDelete={deleteFromDevice} onClear={clearDeviceStorage} onClose={() => setShowDeviceStorage(false)} />}
          </>
        )}

        {view === 'export' && (
          <>
            <Card>
              <SectionTitle>Export Resume</SectionTitle>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12, marginBottom: 12 }}>
                <div><div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Word Document (.docx)</div><div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Best for job portals & ATS</div></div>
                <Button small onClick={exportDocx} disabled={exporting}>{exporting ? '...' : 'Download'}</Button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12, marginBottom: 12 }}>
                <div><div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Plain Text (.txt)</div><div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Copy-paste into web forms</div></div>
                <Button small onClick={exportTxt}>Download</Button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12, marginBottom: 12 }}>
                <div><div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>PDF (Print)</div><div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Browser print → Save as PDF</div></div>
                <Button small onClick={() => { setView('preview'); setTimeout(() => window.print(), 100); }}>Print</Button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12, marginBottom: 12 }}>
                <div><div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Save Data (.json)</div><div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Download to computer</div></div>
                <Button small onClick={exportJson}>Download</Button>
              </div>
            </Card>

            <Card style={{ background: 'rgba(74, 144, 226, 0.08)', border: '1px solid rgba(74, 144, 226, 0.2)' }}>
              <SectionTitle>Device Storage (Test Mode)</SectionTitle>
              <p style={{ color: '#8bb8e8', fontSize: 13, marginTop: -8, marginBottom: 16 }}>
                Simulated phone memory for testing import/export
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12, marginBottom: 12 }}>
                <div><div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Save to Device</div><div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Store in simulated memory</div></div>
                <Button small onClick={saveToDevice}>Save</Button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Browse Device Files</div>
                  <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{savedFiles.length} file(s) saved</div>
                </div>
                <Button small variant="secondary" onClick={() => setShowDeviceStorage(true)}>Open</Button>
              </div>
            </Card>

            <Card style={{ background: 'rgba(74, 226, 74, 0.05)', border: '1px solid rgba(74, 226, 74, 0.2)' }}>
              <SectionTitle>Cloud Backup</SectionTitle>
              <p style={{ color: '#8be8a8', fontSize: 13, marginTop: -8, marginBottom: 16 }}>
                Save to your computer or cloud drive
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Save to Folder</div>
                  <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Choose location (Chrome/Edge)</div>
                </div>
                <Button small onClick={saveWithFilePicker}>Save As...</Button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Open from Folder</div>
                  <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Load backup file</div>
                </div>
                <Button small variant="secondary" onClick={openWithFilePicker}>Open...</Button>
              </div>

              <div style={{ padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: 12, color: '#888' }}>
                Tip: Save to Google Drive, Dropbox, or iCloud folder for automatic cloud sync!
              </div>
            </Card>

            <Button variant="secondary" onClick={() => setView('preview')}>← Back to Preview</Button>
            <div style={{ marginTop: 20 }}><Button variant="danger" onClick={clearAll}>Clear All & Start Over</Button></div>
          </>
        )}

        {view === 'cover' && (
          <CoverLetterEditor
            resumeData={data}
            coverLetters={coverLetters}
            onSave={saveCoverLetter}
            onDelete={deleteCoverLetter}
          />
        )}
      </main>

      {showInstallBanner && (
        <InstallBanner onInstall={handleInstall} onDismiss={dismissInstallBanner} />
      )}

      {/* Auto-save indicator */}
      {saveVisible && (
        <div style={{
          position: 'fixed',
          bottom: 70,
          right: 16,
          background: 'rgba(0, 0, 0, 0.85)',
          color: '#4ae24a',
          padding: '8px 14px',
          borderRadius: 20,
          fontSize: 12,
          zIndex: 99,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          animation: 'fadeIn 0.2s ease',
        }}>
          <span style={{ fontSize: 14 }}>✓</span> Saved
        </div>
      )}

      <nav style={{ display: 'flex', justifyContent: 'space-around', padding: '12px 20px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.1)', position: 'fixed', bottom: 0, left: 0, right: 0 }}>
        {[['sections', '☰', 'Build'], ['edit', '✎', 'Edit'], ['preview', '👁', 'Preview'], ['cover', '✉', 'Letter'], ['export', '↓', 'Export']].map(([v, icon, label]) => (
          <button key={v} onClick={() => { setShowFullPreview(false); setView(v); }} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', color: view === v ? '#4a90e2' : '#888',
            cursor: 'pointer', padding: '8px 12px', fontSize: 10, minWidth: 50,
          }}>
            <span style={{ fontSize: 18 }}>{icon}</span>{label}
          </button>
        ))}
      </nav>

      {/* Print-only resume - hidden on screen, shown when printing */}
      <div className="print-only-resume">
        {data.contact?.name && (
          <>
            <h1>{data.contact.name}</h1>
            <div className="contact-line">
              {[data.contact.email, data.contact.phone, data.contact.city && data.contact.state ? `${data.contact.city}, ${data.contact.state}` : ''].filter(Boolean).join(' | ')}
            </div>
          </>
        )}

        {sections.summary?.enabled && data.summary && (
          <>
            <h2>SUMMARY</h2>
            <p>{data.summary}</p>
          </>
        )}

        {sections.experience?.enabled && data.experience?.length > 0 && (
          <>
            <h2>WORK EXPERIENCE</h2>
            {data.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div className="job-header">
                  <span className="job-title">{exp.title}</span>
                  <span>{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                </div>
                <div>{exp.company}</div>
                {exp.bullets?.length > 0 && (
                  <ul>
                    {exp.bullets.map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </>
        )}

        {sections.education?.enabled && data.education?.length > 0 && (
          <>
            <h2>EDUCATION</h2>
            {data.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <strong>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</strong> | {edu.school}
                <div><em>{edu.graduationDate}{edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</em></div>
              </div>
            ))}
          </>
        )}

        {sections.skills?.enabled && (data.skills?.technical?.length > 0 || data.skills?.soft?.length > 0 || data.skills?.industry?.length > 0) && (
          <>
            <h2>SKILLS</h2>
            {data.skills.technical?.length > 0 && <p><strong>Technical:</strong> {data.skills.technical.join(', ')}</p>}
            {data.skills.soft?.length > 0 && <p><strong>Soft Skills:</strong> {data.skills.soft.join(', ')}</p>}
            {data.skills.industry?.length > 0 && <p><strong>Industry:</strong> {data.skills.industry.join(', ')}</p>}
          </>
        )}

        {sections.certifications?.enabled && data.certifications?.length > 0 && (
          <>
            <h2>CERTIFICATIONS / LICENSES</h2>
            {data.certifications.map((cert, i) => (
              <div key={i}>
                <strong>{cert.name}</strong>
                {cert.licenseNumber && ` | License #: ${cert.licenseNumber}`}
                {cert.issuer && ` | ${cert.issuer}`}
                {cert.date && ` | ${cert.date}`}
              </div>
            ))}
          </>
        )}

        {sections.clearances?.enabled && data.clearances?.length > 0 && (
          <>
            <h2>SECURITY CLEARANCES</h2>
            {data.clearances.map((cl, i) => (
              <div key={i}>{cl.level} - {cl.status}{cl.expirationDate ? ` (Expires: ${cl.expirationDate})` : ''}</div>
            ))}
          </>
        )}

        {sections.references?.enabled && (
          <>
            <h2>REFERENCES</h2>
            {data.references?.available ? (
              <em>Available upon request</em>
            ) : data.references?.list?.length > 0 ? (
              data.references.list.map((r, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <strong>{r.name}</strong> | {r.title} at {r.company}<br />
                  {r.phone} | {r.email}
                </div>
              ))
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
