import React, { useState, useEffect } from 'react';

// ============================================
// R&D Resume Builder v3
// Mobile-first PWA with multi-format export
// ============================================

const STORAGE_KEY = 'rd_resume_builder_data';

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
const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 6, fontWeight: 500 }}>{label}</label>}
    <input 
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
    />
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
const ContactEditor = ({ data, onChange }) => (
  <Card>
    <SectionTitle>Contact Information</SectionTitle>
    <Input label="Full Name" value={data.name} onChange={e => onChange({ ...data, name: e.target.value })} placeholder="John Doe" />
    <Input label="Email" type="email" value={data.email} onChange={e => onChange({ ...data, email: e.target.value })} placeholder="john@email.com" />
    <Input label="Phone" type="tel" value={data.phone} onChange={e => onChange({ ...data, phone: e.target.value })} placeholder="(555) 123-4567" />
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <Input label="City" value={data.city} onChange={e => onChange({ ...data, city: e.target.value })} placeholder="Tampa" />
      </div>
      <div style={{ flex: 1 }}>
        <Input label="State" value={data.state} onChange={e => onChange({ ...data, state: e.target.value })} placeholder="FL" />
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
        <Input label="Company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Company Name" />
        <Input label="Job Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Software Engineer" />
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Input label="Start Date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} placeholder="Jan 2020" />
          </div>
          <div style={{ flex: 1 }}>
            <Input label="End Date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} placeholder="Dec 2023" disabled={form.current} />
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
        <Input label="School" value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} placeholder="University of Florida" />
        <Input label="Degree" value={form.degree} onChange={e => setForm({ ...form, degree: e.target.value })} placeholder="Bachelor of Science" />
        <Input label="Field of Study" value={form.field} onChange={e => setForm({ ...form, field: e.target.value })} placeholder="Computer Science" />
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Input label="Graduation Date" value={form.graduationDate} onChange={e => setForm({ ...form, graduationDate: e.target.value })} placeholder="May 2020" />
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

// FIXED: Skills editor - no longer uses nested component that causes focus loss
const SkillsEditor = ({ data, onChange }) => {
  const [techInput, setTechInput] = useState('');
  const [softInput, setSoftInput] = useState('');
  const [industryInput, setIndustryInput] = useState('');

  const addSkill = (category, value, setValue) => {
    if (!value.trim()) return;
    onChange({ ...data, [category]: [...data[category], value.trim()] });
    setValue('');
  };

  const removeSkill = (category, idx) => {
    onChange({ ...data, [category]: data[category].filter((_, i) => i !== idx) });
  };

  const SkillTags = ({ skills, category }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 8, minHeight: 20 }}>
      {skills.map((skill, idx) => (
        <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 12px', background: 'rgba(74, 144, 226, 0.2)', borderRadius: 20, fontSize: 14, margin: 4, color: '#8bb8e8' }}>
          {skill}
          <button onClick={() => removeSkill(category, idx)} style={{ background: 'none', border: 'none', color: '#e24a4a', marginLeft: 6, cursor: 'pointer', padding: 0, fontSize: 16 }}>×</button>
        </span>
      ))}
    </div>
  );

  return (
    <Card>
      <SectionTitle>Skills</SectionTitle>
      
      {/* Technical Skills */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 6, fontWeight: 500 }}>Technical Skills</label>
        <SkillTags skills={data.technical} category="technical" />
        <div style={{ display: 'flex', gap: 8 }}>
          <input 
            style={{ flex: 1, padding: '14px 16px', fontSize: 16, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', outline: 'none', boxSizing: 'border-box' }}
            value={techInput}
            onChange={e => setTechInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill('technical', techInput, setTechInput); }}}
            placeholder="Add technical skill..."
          />
          <Button small onClick={() => addSkill('technical', techInput, setTechInput)}>+</Button>
        </div>
      </div>

      {/* Soft Skills */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 6, fontWeight: 500 }}>Soft Skills</label>
        <SkillTags skills={data.soft} category="soft" />
        <div style={{ display: 'flex', gap: 8 }}>
          <input 
            style={{ flex: 1, padding: '14px 16px', fontSize: 16, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', outline: 'none', boxSizing: 'border-box' }}
            value={softInput}
            onChange={e => setSoftInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill('soft', softInput, setSoftInput); }}}
            placeholder="Add soft skill..."
          />
          <Button small onClick={() => addSkill('soft', softInput, setSoftInput)}>+</Button>
        </div>
      </div>

      {/* Industry Skills */}
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 6, fontWeight: 500 }}>Industry-Specific Skills</label>
        <SkillTags skills={data.industry} category="industry" />
        <div style={{ display: 'flex', gap: 8 }}>
          <input 
            style={{ flex: 1, padding: '14px 16px', fontSize: 16, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', outline: 'none', boxSizing: 'border-box' }}
            value={industryInput}
            onChange={e => setIndustryInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill('industry', industryInput, setIndustryInput); }}}
            placeholder="Add industry skill..."
          />
          <Button small onClick={() => addSkill('industry', industryInput, setIndustryInput)}>+</Button>
        </div>
      </div>
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
            <Input label="Investigation Date" value={form.investigationDate} onChange={e => setForm({ ...form, investigationDate: e.target.value })} placeholder="Jan 2022" />
          </div>
          <div style={{ flex: 1 }}>
            <Input label="Expiration Date" value={form.expirationDate} onChange={e => setForm({ ...form, expirationDate: e.target.value })} placeholder="Jan 2027" />
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
            <Input label="Date Issued" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} placeholder="Mar 2023" />
          </div>
          <div style={{ flex: 1 }}>
            <Input label="Expiration (optional)" value={form.expiration} onChange={e => setForm({ ...form, expiration: e.target.value })} placeholder="Mar 2026" />
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

// Main App
export default function RDResumeBuilder() {
  const [view, setView] = useState('sections');
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [data, setData] = useState(DEFAULT_DATA);
  const [currentSection, setCurrentSection] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sections) setSections(prev => ({ ...prev, ...parsed.sections }));
        if (parsed.data) setData(prev => ({ ...prev, ...parsed.data }));
      }
    } catch (e) {
      console.error('Failed to load saved data:', e);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sections, data }));
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }, [sections, data]);

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
      const docx = await import('https://cdn.jsdelivr.net/npm/docx@8.5.0/+esm');
      const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = docx;
      
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
      case 'contact': return <ContactEditor data={data.contact} onChange={v => updateData('contact', v)} />;
      case 'summary': return <SummaryEditor data={data.summary} onChange={v => updateData('summary', v)} />;
      case 'experience': return <ExperienceEditor data={data.experience} onChange={v => updateData('experience', v)} />;
      case 'education': return <EducationEditor data={data.education} onChange={v => updateData('education', v)} />;
      case 'skills': return <SkillsEditor data={data.skills} onChange={v => updateData('skills', v)} />;
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
      <header style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>R&D Resume Builder</h1>
        <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0 0' }}>ATS-Optimized Resumes</p>
      </header>

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

            <div style={{ marginTop: 20 }}>
              <Button variant="secondary" onClick={() => document.getElementById('importInput').click()}>Import Saved Resume (JSON)</Button>
              <input type="file" id="importInput" accept=".json" onChange={importJson} style={{ display: 'none' }} />
            </div>
          </>
        )}

        {view === 'edit' && (
          <>
            <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
              {enabledSections.map((_, idx) => (
                <div key={idx} style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: idx < currentSection ? '#4ae24a' : idx === currentSection ? '#4a90e2' : 'rgba(255,255,255,0.2)',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
              Section {currentSection + 1} of {enabledSections.length}: <strong style={{ color: '#fff' }}>{sections[enabledSections[currentSection]]?.label}</strong>
            </div>
            {renderEditor()}
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => currentSection === 0 ? setView('sections') : setCurrentSection(p => p - 1)}>← Back</Button>
              <Button style={{ flex: 1 }} onClick={() => currentSection === enabledSections.length - 1 ? setView('preview') : setCurrentSection(p => p + 1)}>
                {currentSection === enabledSections.length - 1 ? 'Preview' : 'Next →'}
              </Button>
            </div>
          </>
        )}

        {view === 'preview' && (
          <>
            <Card><SectionTitle>Resume Preview</SectionTitle><ResumePreview sections={sections} data={data} onExpand={() => setShowFullPreview(true)} /></Card>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => setView('edit')}>← Edit</Button>
              <Button style={{ flex: 1 }} onClick={() => setView('export')}>Export →</Button>
            </div>
            {showFullPreview && <FullscreenPreview sections={sections} data={data} onClose={() => setShowFullPreview(false)} />}
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
                <div><div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Save Data (.json)</div><div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Reload and edit later</div></div>
                <Button small onClick={exportJson}>Save</Button>
              </div>
            </Card>

            <Button variant="secondary" onClick={() => setView('preview')}>← Back to Preview</Button>
            <div style={{ marginTop: 20 }}><Button variant="danger" onClick={clearAll}>Clear All & Start Over</Button></div>
          </>
        )}
      </main>

      <nav style={{ display: 'flex', justifyContent: 'space-around', padding: '12px 20px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.1)', position: 'fixed', bottom: 0, left: 0, right: 0 }}>
        {[['sections', '☰', 'Sections'], ['edit', '✎', 'Edit'], ['preview', '👁', 'Preview'], ['export', '↓', 'Export']].map(([v, icon, label]) => (
          <button key={v} onClick={() => { setShowFullPreview(false); setView(v); }} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', color: view === v ? '#4a90e2' : '#888',
            cursor: 'pointer', padding: '8px 16px', fontSize: 11, minWidth: 60,
          }}>
            <span style={{ fontSize: 20 }}>{icon}</span>{label}
          </button>
        ))}
      </nav>
    </div>
  );
}
