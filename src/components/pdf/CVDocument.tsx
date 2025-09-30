// src/components/pdf/CVDocument.tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Link,
} from '@react-pdf/renderer';
import { CVData } from '../../types/cv.types';

// Register a better font
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 36,
    lineHeight: 1.6,
    color: '#222',
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 24,
  },
  headerBorder: {
    borderBottom: 2,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 16,
    marginBottom: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 8,
  },
  contactInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    fontSize: 10,
    color: '#4b5563',
    gap: 10,
    marginTop: 4,
    marginBottom: 2,
    alignItems: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 18,
    marginBottom: 2,
  },
  contactIcon: {
    width: 11,
    height: 11,
    marginRight: 4,
    color: '#4b5563',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 10,
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#374151',
    textAlign: 'justify',
  },
  experienceItem: {
    marginBottom: 14,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  experienceLeft: {
    flex: 1,
    paddingRight: 10,
  },
  jobTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 2,
  },
  company: {
    fontSize: 11,
    color: '#374151',
  },
  dateRange: {
    fontSize: 9,
    color: '#6b7280',
    whiteSpace: 'nowrap',
  },
  description: {
    fontSize: 10,
    color: '#374151',
    marginTop: 6,
    marginBottom: 4,
    lineHeight: 1.5,
  },
  bulletPoints: {
    marginTop: 6,
    marginLeft: 0,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bullet: {
    width: 15,
    fontSize: 10,
    color: '#374151',
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.4,
  },
  projectItem: {
    marginBottom: 10,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  projectTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#111827',
    marginRight: 12,
    flex: 1,
  },
  projectLink: {
    fontSize: 9,
    color: '#2563eb',
    textDecoration: 'none',
  },
  projectDescription: {
    fontSize: 10,
    color: '#374151',
    marginTop: 6,
    lineHeight: 1.5,
  },
  educationItem: {
    marginBottom: 12,
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  educationLeft: {
    flex: 1,
  },
  degree: {
    fontSize: 13,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 2,
  },
  institution: {
    fontSize: 11,
    color: '#374151',
    marginBottom: 2,
  },
  grade: {
    fontSize: 9,
    color: '#6b7280',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  skillBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: 500,
  },
  skillLevel: {
    fontSize: 9,
    color: '#6b7280',
    marginLeft: 6,
    fontWeight: 400,
  },
});

interface Props {
  data: CVData;
}

export function CVDocument({ data }: Props) {
  const formatDate = (date: string): string => {
    if (!date) return '';
    try {
      const [year, month] = date.split('-');
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
    } catch {
      return date;
    }
  };

  const ensureAbsoluteUrl = (url: string): string => {
    if (!url) {
      return '';
    }
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  };

  const projects = Array.isArray(data.projects) ? data.projects : [];

  // SVG icon components for PDF
  const MailIcon = () => (
    <svg style={styles.contactIcon} viewBox="0 0 24 24">
      <path d="M4 4h16v16H4V4zm8 8l8-6H4l8 6zm0 2l-8-6v10h16V8l-8 6z" fill="#4b5563" />
    </svg>
  );
  const PhoneIcon = () => (
    <svg style={styles.contactIcon} viewBox="0 0 24 24">
      <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21c1.21.49 2.53.76 3.88.76a1 1 0 011 1v3.5a1 1 0 01-1 1C7.61 22 2 16.39 2 9.5a1 1 0 011-1H6.5a1 1 0 011 1c0 1.35.27 2.67.76 3.88a1 1 0 01-.21 1.11l-2.2 2.2z" fill="#4b5563" />
    </svg>
  );
  const LocationIcon = () => (
    <svg style={styles.contactIcon} viewBox="0 0 24 24">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" fill="#4b5563" />
    </svg>
  );
  const LinkedinIcon = () => (
    <svg style={styles.contactIcon} viewBox="0 0 24 24">
      <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm13.5 10.28h-3v-4.5c0-1.07-.93-2-2-2s-2 .93-2 2v4.5h-3v-9h3v1.22c.41-.63 1.36-1.22 2.25-1.22 2.07 0 3.75 1.68 3.75 3.75v5.25z" fill="#4b5563" />
    </svg>
  );
  const GithubIcon = () => (
    <svg style={styles.contactIcon} viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.36 6.84 9.72.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.61-3.37-1.36-3.37-1.36-.45-1.17-1.1-1.48-1.1-1.48-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.65.35-1.11.63-1.37-2.22-.26-4.56-1.13-4.56-5.04 0-1.11.39-2.02 1.03-2.73-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.04a9.38 9.38 0 012.5-.34c.85.01 1.71.12 2.5.34 1.91-1.32 2.75-1.04 2.75-1.04.55 1.41.2 2.45.1 2.71.64.71 1.03 1.62 1.03 2.73 0 3.92-2.34 4.77-4.57 5.03.36.32.68.94.68 1.89 0 1.37-.01 2.47-.01 2.81 0 .27.18.58.69.48A10.01 10.01 0 0022 12.26C22 6.58 17.52 2 12 2z" fill="#4b5563" />
    </svg>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerBorder}>
            <Text style={styles.name}>
              {data.personalInfo.fullName || 'Your Name'}
            </Text>
            <View style={styles.contactInfo}>
              {data.personalInfo.email && (
                <View style={styles.contactItem}>
                  <MailIcon />
                  <Text>{data.personalInfo.email}</Text>
                </View>
              )}
              {data.personalInfo.phone && (
                <View style={styles.contactItem}>
                  <PhoneIcon />
                  <Text>{data.personalInfo.phone}</Text>
                </View>
              )}
              {data.personalInfo.location && (
                <View style={styles.contactItem}>
                  <LocationIcon />
                  <Text>{data.personalInfo.location}</Text>
                </View>
              )}
            </View>
            <View style={styles.contactInfo}>
              {data.personalInfo.linkedin && (
                <View style={styles.contactItem}>
                  <LinkedinIcon />
                  <Text>{data.personalInfo.linkedin}</Text>
                </View>
              )}
              {data.personalInfo.github && (
                <View style={styles.contactItem}>
                  <GithubIcon />
                  <Text>{data.personalInfo.github}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Professional Summary */}
        {data.personalInfo.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summary}>{data.personalInfo.summary}</Text>
          </View>
        )}

        {/* Work Experience */}
        {data.workExperience && data.workExperience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {data.workExperience.map((exp) => (
              <View key={exp.id} style={styles.experienceItem}>
                <View style={styles.experienceHeader}>
                  <View style={styles.experienceLeft}>
                    <Text style={styles.jobTitle}>{exp.position || 'Position'}</Text>
                    <Text style={styles.company}>{exp.company || 'Company'}</Text>
                  </View>
                  <Text style={styles.dateRange}>
                    {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                  </Text>
                </View>
                
                {exp.description && (
                  <Text style={styles.description}>{exp.description}</Text>
                )}
                
                {exp.highlights && exp.highlights.length > 0 && (
                  <View style={styles.bulletPoints}>
                    {exp.highlights
                      .filter((h) => h && h.trim())
                      .map((highlight, index) => (
                        <View key={index} style={styles.bulletPoint}>
                          <Text style={styles.bullet}>• </Text>
                          <Text style={styles.bulletText}>{highlight}</Text>
                        </View>
                      ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((project) => {
              const linkLabel = project.link?.trim();
              const href = linkLabel ? ensureAbsoluteUrl(linkLabel) : '';

              return (
                <View key={project.id} style={styles.projectItem}>
                  <View style={styles.projectHeader}>
                    <Text style={styles.projectTitle}>{project.name || 'Project'}</Text>
                    {linkLabel && href && (
                      <Link src={href} style={styles.projectLink}>
                        {linkLabel}
                      </Link>
                    )}
                  </View>
                  {project.description && project.description.trim() && (
                    <Text style={styles.projectDescription}>{project.description}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {data.education.map((edu) => {
              const grade = edu.grade ?? (edu as typeof edu & { gpa?: string }).gpa;

              return (
                <View key={edu.id} style={styles.educationItem}>
                  <View style={styles.educationHeader}>
                    <View style={styles.educationLeft}>
                      <Text style={styles.degree}>
                        {edu.degree || 'Degree'} in {edu.field || 'Field'}
                      </Text>
                      <Text style={styles.institution}>
                        {edu.institution || 'Institution'}
                      </Text>
                      {grade && (
                        <Text style={styles.grade}>Grade: {grade}</Text>
                      )}
                    </View>
                    <Text style={styles.dateRange}>
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {data.skills.map((skill) => (
                <View key={skill.id} style={styles.skillBadge}>
                  <Text style={styles.skillText}>
                    {skill.name}
                    {skill.level && skill.level !== 'intermediate' && (
                      <Text style={styles.skillLevel}> ({skill.level})</Text>
                    )}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
