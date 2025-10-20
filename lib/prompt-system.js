// lib/prompt-system.js - Comprehensive Prompt Management System for AI Meeting Assistant

/**
 * Prompt System Architecture
 * Manages dynamic prompt generation based on role, module, meeting type, and custom goals
 */

// ============= LAYER 1: BASE TEMPLATES =============

/**
 * Role-based prompt templates
 * Defines perspective and focus areas for different user roles
 */
const ROLE_TEMPLATES = {
  student: {
    systemRole: "You are an educational AI assistant helping students reflect on their learning process and collaboration.",
    perspective: "Analyze from a learner's perspective",
    focusAreas: [
      "Knowledge acquisition and understanding",
      "Problem exploration and solution discovery",
      "Peer collaboration and discussion quality",
      "Learning obstacles and confusion points",
      "Skill development and application"
    ],
    outputStyle: "Educational, encouraging exploration, highlighting learning opportunities",
    knowledgeFraming: {
      explicit: "Focus on concepts that can be studied and memorized",
      tacit: "Identify skills and insights gained through practice and experience"
    }
  },
  
  'tutor/instructor': {
    systemRole: "You are an educational AI assistant helping instructors evaluate teaching effectiveness and student progress.",
    perspective: "Analyze from an educator's perspective",
    focusAreas: [
      "Learning objective achievement",
      "Student comprehension levels",
      "Teaching strategy effectiveness",
      "Knowledge transfer clarity",
      "Student engagement and participation"
    ],
    outputStyle: "Evaluative, providing constructive feedback, identifying teaching improvements",
    knowledgeFraming: {
      explicit: "Focus on curriculum content and assessment criteria",
      tacit: "Identify pedagogical insights and student behavioral patterns"
    }
  }
};

/**
 * Module-specific domain knowledge and concepts
 */
const MODULE_TEMPLATES = {
  'DE4 ERO': {
    fullName: "Enterprise Roll Out",
    moduleContext: `DE4-ERO focuses on developing viable technology-based enterprises aligned with UN Sustainable Development Goals. Teams work to create tangible value propositions, validate business models, and prepare for market launch.`,
    domainKnowledge: [
        "Enterprise development and validation",
        "Value proposition design and testing",
        "Business model innovation",
        "Market analysis and competitive positioning",
        "Investor pitch preparation",
        "Product-market fit validation",
        "Risk assessment and mitigation",
        "Financial planning (P&L statements)",
        "Intellectual property considerations",
        "Sustainable business practices (SDG alignment)"
    ],
    keyConcepts: [
    "Customer discovery and validation",
    "Minimum viable product (MVP)",
    "Market opportunity identification",
    "Business model canvas",
    "Funding roadmap development",
    "Routes to market strategy",
    "Stakeholder engagement",
    "Brand proposition development",
    "Pre-launch preparation",
    "Team dynamics and project management"
    ],
    decisionCriteria: [
      "Market viability and size",
    "Technical feasibility",
    "Financial sustainability",
    "SDG impact alignment",
    "Competitive differentiation",
    "Risk-return profile",
    "Resource requirements",
    "Time to market",
    "Scalability potential",
    "IP protection strategy"
    ],
    explicitMarkers: [
      "market research data",
    "user testing results",
    "financial projections",
    "competitor analysis",
    "technical specifications",
    "regulatory requirements",
    "IP landscape analysis",
    "customer feedback metrics",
    "business model documentation",
    "risk assessment matrices"
    ],
    tacitMarkers: [
      "entrepreneurial intuition",
    "market sensing capabilities",
    "team collaboration patterns",
    "pivot decisions and rationale",
    "customer empathy insights",
    "business coach guidance interpretation",
    "strategic positioning choices",
    "brand identity development",
    "stakeholder relationship building",
    "uncertainty navigation strategies"
    ],
    weeklyMilestones: {
    'Week 1': {
      expectedProgress: [
        "Team formation completed",
        "Initial opportunity identification",
        "SDG alignment discussion",
        "First team meeting and role allocation"
      ],
      keyDeliverables: [
        "Team charter or MoU draft",
        "Initial opportunity areas identified"
      ]
    },
    'Week 2': {
      expectedProgress: [
        "Opportunity refinement and validation",
        "Initial market research",
        "Problem definition clarity",
        "Early customer discovery planning"
      ],
      keyDeliverables: [
        "Problem statement",
        "Initial market size estimation"
      ]
    },
    'Week 3-4': {
      expectedProgress: [
        "Self-study period with coach meetings",
        "Deep market research",
        "Initial customer interviews",
        "Business model hypothesis"
      ],
      keyDeliverables: [
        "Customer discovery findings",
        "Initial business model canvas"
      ]
    },
    'Week 5': {
      expectedProgress: [
        "First formal Project Review Tutorial",
        "Evidence gathering for opportunity",
        "Competitive landscape mapping",
        "Value proposition draft"
      ],
      keyDeliverables: [
        "Competitive analysis",
        "Value proposition statement"
      ]
    },
    'Week 6-7': {
      expectedProgress: [
        "Customer validation activities",
        "MVP concept development",
        "Business model refinement",
        "Risk identification"
      ],
      keyDeliverables: [
        "Customer validation results",
        "MVP specifications"
      ]
    },
    'Week 8-9': {
      expectedProgress: [
        "Innovation Pitch preparation",
        "Evidence synthesis",
        "Financial model basics",
        "Route to market strategy"
      ],
      keyDeliverables: [
        "Pitch deck draft",
        "Supporting evidence documentation"
      ]
    },
    'Week 10-11': {
      expectedProgress: [
        "Innovation Pitch refinement",
        "Pitch practice sessions",
        "Q&A preparation",
        "Visual assets finalization"
      ],
      keyDeliverables: [
        "Final Innovation Pitch (Week 11)",
        "2-page supporting report"
      ]
    },
    // Term 2
    'Week 12-15': {
      expectedProgress: [
        "Post-pitch iteration",
        "Website development start",
        "Brand identity development",
        "Detailed financial planning"
      ],
      keyDeliverables: [
        "Website wireframes",
        "Brand guidelines"
      ]
    },
    'Week 16-18': {
      expectedProgress: [
        "Video asset production",
        "Stakeholder validation",
        "P&L statement development",
        "Risk assessment completion"
      ],
      keyDeliverables: [
        "Video script and storyboard",
        "Draft P&L statement"
      ]
      
    },
    'Week 19-20': {
  expectedProgress: [
    "Website finalization",
    "Final testing and validation",
    "Report writing",
    "Pre-launch preparation"
  ],
  keyDeliverables: [
    "Final Website (Week 20)",
    "Final Report with P&L and risk assessment"
  ]
}
    }
 },

'IDE2 TTL': {
    fullName: "Transdisciplinary Teamwork and Leadership",
    moduleContext: `IDE2-TTL focuses on developing experience and ability to lead and implement large innovation projects addressing significant challenges. Teams work through a comprehensive IDE process with consideration of social, technological, environmental, economic and values-based factors, exemplifying exploration with high levels of prototyping and evaluation.`,
    
    domainKnowledge: [
      "Transdisciplinary collaboration methods",
      "Innovation project management", 
      "Stakeholder engagement strategies",
      "Enterprise and innovation tools",
      "Systems thinking and integration",
      "Rapid prototyping methodologies",
      "User testing and validation",
      "Market opportunity identification",
      "Sustainability integration",
      "Design-engineering synthesis"
    ],
    
    keyConcepts: [
      "Transdisciplinary working",
      "Innovation opportunity validation",
      "Iterative design process",
      "Evidence-based design decisions",
      "Stakeholder network building",
      "Functional prototype development",
      "Market disruption strategies",
      "Team leadership dynamics",
      "Project scalability assessment",
      "Engineering challenge resolution"
    ],
    
    decisionCriteria: [
      "Innovation potential",
      "Design quality",
      "Engineering feasibility",
      "Impact assessment",
      "Delivery capability",
      "Team collaboration effectiveness",
      "Evidence quality",
      "Prototype functionality",
      "Market viability",
      "Scalability factor"
    ],
    
    explicitMarkers: [
      "competitor analysis",
      "research landscape mapping",
      "user testing results",
      "technical specifications",
      "market research data",
      "prototype test results",
      "stakeholder feedback",
      "project planning documentation",
      "risk assessment matrices",
      "individual contribution records"
    ],
    
    tacitMarkers: [
      "team dynamics insights",
      "creative breakthrough moments",
      "pivot decision rationale",
      "experimental discoveries",
      "collaborative synergies",
      "leadership emergence patterns",
      "innovation intuition",
      "problem-solving approaches",
      "transdisciplinary integration",
      "stakeholder relationship building"
    ],
    
    weeklyMilestones: {
      // Phase 1 - Idea Generation / Early Experiments
      'Week 1-2': {
        expectedProgress: [
          "Team consolidation from Professional Consolidation unit",
          "Innovation opportunity refinement",
          "Initial competitor analysis/research landscape",
          "Early experimentation planning",
          "Stakeholder network initiation"
        ],
        keyDeliverables: [
          "Team charter finalization",
          "Project direction document",
          "Initial experiments plan"
        ]
      },
      'Week 3-4': {
        expectedProgress: [
          "Multiple directional ideas generation",
          "Early experiments execution",
          "Technology tests and mock-ups",
          "Concept feasibility testing",
          "3D work and sketch models",
          "Material gathering and review"
        ],
        keyDeliverables: [
          "Early experimental results",
          "Concept sketches and models",
          "Feasibility assessments"
        ]
      },
      'Week 5': {
        expectedProgress: [
          "Gateway 2 preparation",
          "Best ideas selection and refinement",
          "Innovation opportunities clarification",
          "Competitor analysis completion",
          "Next steps definition"
        ],
        keyDeliverables: [
          "Gateway 2 presentation (7/11/2024)",
          "Shortlist of innovative opportunities",
          "Clear route forward vision"
        ]
      },
      
      // Phase 2 - Development / Advanced Experimentation
      'Week 6-7': {
        expectedProgress: [
          "Advanced concept development",
          "Complex experiments execution",
          "Functional mock-up creation",
          "Concept visualization development",
          "Market rationale clarification"
        ],
        keyDeliverables: [
          "Advanced prototypes",
          "Experimental results",
          "Market positioning document"
        ]
      },
      'Week 8-9': {
        expectedProgress: [
          "Gateway 3 Demo Day preparation",
          "Physical prototypes completion",
          "System mock-ups finalization",
          "Production planning clarity",
          "Expert consultation and validation"
        ],
        keyDeliverables: [
          "Gateway 3 Demo Day (28/11/2024)",
          "Working prototypes and models",
          "NO POWERPOINT - physical demonstrations only"
        ]
      },
      
      // Phase 3 - Delivery
      'Week 10-11': {
        expectedProgress: [
          "Final builds and production",
          "Presentation materials creation",
          "Visual models completion",
          "Supporting information preparation",
          "Individual contribution documentation"
        ],
        keyDeliverables: [
          "Final presentation preparation",
          "Working prototypes",
          "Visual models",
          "Individual Contribution Report"
        ]
      },
      'Week 12': {
        expectedProgress: [
          "Group Project Presentation execution",
          "Exhibition setup and delivery",
          "External audience communication",
          "Professional presentation delivery"
        ],
        keyDeliverables: [
          "Group Project Presentation (9/12/2024)",
          "Individual Contribution Report submission (9/12/2024)",
          "Public Exhibition (17-19/12/2024)"
        ]
      }
    },
    
    // IDE2 TTL特定的评估重点
    assessmentCriteria: {
      professionalism: {
        weight: "20%",
        individual: true,
        focus: [
          "Individual contribution to tasks",
          "Transdisciplinary team working",
          "Stakeholder engagement",
          "Design research contribution",
          "Project planning and time management"
        ]
      },
      innovation: {
        weight: "25%",
        team: true,
        focus: [
          "Innovation opportunity identification",
          "Originality and added value",
          "Evidence quality",
          "Impact potential",
          "Route to market clarity"
        ]
      },
      prototypingEvaluation: {
        weight: "25%",
        team: true,
        focus: [
          "Iterative prototyping depth",
          "Testing and validation",
          "Technical resolution",
          "System consideration",
          "Professional embodiment"
        ]
      },
      communicationPresentation: {
        weight: "10%",
        team: true,
        focus: [
          "Clear articulation",
          "Professional delivery",
          "Time management",
          "Visual communication"
        ]
      },
      communicationExhibition: {
        weight: "20%",
        team: true,
        focus: [
          "External audience engagement",
          "Design proposition clarity",
          "Immersive experience creation",
          "Professional exhibition quality"
        ]
      }
    },
    
    // Gateway特定要求
    gatewayRequirements: {
      gateway2: {
        assessmentCriteria: [
          "Project potential",
          "Quality of ideas & experiments",
          "Foresight / Clear vision of route forward"
        ],
        format: "10 min presentation + 10 min Q&A",
        expectations: "Rich assortment of conceptual work, early experimental discoveries"
      },
      gateway3: {
        assessmentCriteria: [
          "Innovation",
          "Design", 
          "Engineering",
          "Impact",
          "Delivery"
        ],
        format: "10 min demo + 10 min Q&A, NO POWERPOINT",
        expectations: "Physical demonstrations, working prototypes, resolved concepts"
      }
 }
}
 
    
};

/**
 * Meeting type specific analysis templates
 */
const MEETING_TYPE_TEMPLATES = {
  'brainstorming': {
    processFocus: "Idea generation and creative exploration",
    analysisFramework: {
      trackingPoints: [
        "New idea emergence and evolution",
        "Connections between different concepts",
        "Divergent and convergent thinking phases",
        "Creative breakthroughs and insights",
        "Initial feasibility considerations"
      ],
      outputPriorities: {
        ideaClusters: true,
        ideaEvolution: true,
        promisingConcepts: true,
        parkingLot: true,
        nextSteps: true
      }
    },
    promptGuidance: `Focus on tracking the creative process:
    - How ideas build upon each other
    - Which concepts gain momentum
    - What triggers new directions
    - How the team evaluates initial feasibility
    - What ideas are selected for further exploration`
  },
  
  'technical-review': {
    processFocus: "Technical evaluation and problem-solving",
    analysisFramework: {
      trackingPoints: [
        "Technical challenges identified",
        "Solution approaches discussed",
        "Trade-offs and constraints",
        "Risk assessment",
        "Technical decisions made"
      ],
      outputPriorities: {
        technicalDecisions: true,
        problemsSolved: true,
        risksIdentified: true,
        actionItems: true,
        dependencies: true
      }
    },
    promptGuidance: `Focus on technical depth:
    - Specific technical problems and solutions
    - Evidence and reasoning for technical choices
    - Identified risks and mitigation strategies
    - Technical dependencies and constraints
    - Clear action items with technical specifications`
  },
  
  'user-testing': {
    processFocus: "User feedback collection and experience analysis",
    analysisFramework: {
      trackingPoints: [
        "User pain points and frustrations",
        "Positive user reactions",
        "Usability issues discovered",
        "Feature requests and suggestions",
        "User behavior patterns"
      ],
      outputPriorities: {
        userInsights: true,
        usabilityIssues: true,
        featureRequests: true,
        behaviorPatterns: true,
        improvementPriorities: true
      }
    },
    promptGuidance: `Focus on user experience:
    - Direct user feedback and reactions
    - Observed vs. expected behaviors
    - Usability problems and their severity
    - User suggestions and their rationale
    - Patterns across multiple users`
  },
  
  'design-critique': {
    processFocus: "Design evaluation and iterative improvement",
    analysisFramework: {
      trackingPoints: [
        "Design strengths and weaknesses",
        "Aesthetic and functional feedback",
        "Alignment with design principles",
        "Improvement suggestions",
        "Design decisions and rationale"
      ],
      outputPriorities: {
        designFeedback: true,
        strengthsWeaknesses: true,
        improvementSuggestions: true,
        designRationale: true,
        nextIterations: true
      }
    },
    promptGuidance: `Focus on design quality:
    - Specific design elements discussed
    - Rationale for design choices
    - Constructive criticism and suggestions
    - Alignment with project goals
    - Concrete improvement actions`
  },
  
  'project-planning': {
    processFocus: "Planning, scheduling, and resource allocation",
    analysisFramework: {
      trackingPoints: [
        "Goals and milestones defined",
        "Task breakdown and allocation",
        "Timeline and deadlines",
        "Resource requirements",
        "Risk and contingency planning"
      ],
      outputPriorities: {
        projectGoals: true,
        taskAllocation: true,
        timeline: true,
        resourceNeeds: true,
        riskMitigation: true
      }
    },
    promptGuidance: `Focus on project management:
    - Clear goals and success criteria
    - Task assignments and responsibilities
    - Realistic timelines and dependencies
    - Resource allocation decisions
    - Identified risks and mitigation plans`
  },
  
  'problem-solving': {
    processFocus: "Systematic problem analysis and solution development",
    analysisFramework: {
      trackingPoints: [
        "Problem definition and scope",
        "Root cause analysis",
        "Solution alternatives",
        "Evaluation criteria",
        "Selected approach and rationale"
      ],
      outputPriorities: {
        problemDefinition: true,
        rootCauses: true,
        solutionOptions: true,
        decisionCriteria: true,
        chosenSolution: true
      }
    },
    promptGuidance: `Focus on problem-solving process:
    - Clear problem articulation
    - Systematic analysis approach
    - Multiple solution alternatives
    - Evaluation methodology
    - Decision rationale and next steps`
  }
};

// ============= LAYER 2: CONTEXT ENHANCERS =============

/**
 * Integrates custom meeting goals into prompts
 */
class GoalIntegrator {
  static parseGoals(goalsText) {
    if (!goalsText || goalsText.trim() === '') {
      return null;
    }
    
    // Extract key themes and objectives
    const keywords = this.extractKeywords(goalsText);
    const objectives = this.identifyObjectives(goalsText);
    const successCriteria = this.extractSuccessCriteria(goalsText);
    
    return {
      original: goalsText,
      keywords,
      objectives,
      successCriteria,
      promptAddition: this.buildGoalPrompt(goalsText, keywords, objectives)
    };
  }
  
  static extractKeywords(text) {
    // Simple keyword extraction - can be enhanced with NLP
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    const words = text.toLowerCase().split(/\s+/);
    return words
      .filter(word => word.length > 3 && !commonWords.has(word))
      .slice(0, 5);
  }
  
  static identifyObjectives(text) {
    const objectivePatterns = [
      /(?:aim|goal|objective|purpose|intent)(?:s)?\s+(?:is|are)\s+to\s+([^.]+)/i,
      /(?:want|need|plan|intend)\s+to\s+([^.]+)/i,
      /(?:explore|investigate|analyze|develop|create|design)\s+([^.]+)/i
    ];
    
    const objectives = [];
    for (const pattern of objectivePatterns) {
      const match = text.match(pattern);
      if (match) {
        objectives.push(match[1].trim());
      }
    }
    return objectives;
  }
  
  static extractSuccessCriteria(text) {
    const criteriaPatterns = [
      /(?:success|successful|achieve|accomplish|complete)\s+(?:if|when|by)\s+([^.]+)/i,
      /(?:measure|evaluate|assess)\s+(?:by|through|using)\s+([^.]+)/i
    ];
    
    const criteria = [];
    for (const pattern of criteriaPatterns) {
      const match = text.match(pattern);
      if (match) {
        criteria.push(match[1].trim());
      }
    }
    return criteria;
  }
  
  static buildGoalPrompt(original, keywords, objectives) {
    let prompt = "\n\nMeeting-Specific Goals and Focus:\n";
    prompt += `The team has set the following goals for this meeting: "${original}"\n`;
    
    if (keywords.length > 0) {
      prompt += `Key focus areas: ${keywords.join(', ')}\n`;
    }
    
    if (objectives.length > 0) {
      prompt += `Specific objectives:\n`;
      objectives.forEach(obj => {
        prompt += `- ${obj}\n`;
      });
    }
    
    prompt += "\nPlease pay special attention to discussions related to these goals and evaluate whether they were achieved.";
    
    return prompt;
  }
}

/**
 * Integrates team member information
 */
class TeamContextBuilder {
  static buildTeamContext(teamMembers) {
    if (!teamMembers || teamMembers.length === 0) {
      return '';
    }
    
    let context = "\n\nTeam Composition:\n";
    teamMembers.forEach((member, index) => {
      if (member && member.trim()) {
        context += `- Speaker ${String.fromCharCode(65 + index)}: ${member}\n`;
      }
    });
    
    context += "\nUse this information to better identify speakers and attribute contributions accurately.";
    
    return context;
  }
}

// ============= LAYER 3: ANALYSIS STRATEGIES =============

/**
 * Different strategies for different analysis stages
 */


const ANALYSIS_STRATEGIES = {
  // Note: transcription strategy is defined but not actively used
  // analyze.js uses AssemblyAI directly for pure transcription
  // Kept for completeness and potential future use
  transcription: {
    complexity: 'basic',
    systemPrompt: "You are a transcription assistant focusing on accurate speech-to-text conversion and speaker identification.",
    analysisDepth: 'none',
    outputFormat: 'transcript_only',
    specialInstructions: `
    IMPORTANT: This is pure TRANSCRIPTION processing.
    - Focus ONLY on accurate speech-to-text conversion
    - Identify speakers clearly (Speaker A, Speaker B, etc.)
    - Maintain conversation flow and timing
    - Do NOT analyze content or make decisions
    - Do NOT provide summaries or insights
    - Output clean, formatted transcript only`,
    transcriptionPrompt: "Convert the audio to accurate text with clear speaker identification."
  },

  // Real-time analysis during meeting
  time: {
    complexity: 'focused',
    systemPrompt: "You are a real-time decision tracker for student meetings. Focus ONLY on identifying NEW decisions and avoid repeating previous analysis.",
    analysisDepth: 'incremental_decisions',
    outputFormat: 'realtime_decisions',
    specialInstructions: `
    IMPORTANT: This is REAL-TIME INCREMENTAL analysis during an ongoing meeting.
    - ONLY identify NEW DECISIONS made in this current segment
    - DO NOT repeat decisions already identified in previous segments
    - For each NrealEW decision, extract supporting EXPLICIT and TACIT knowledge
    - Number decisions sequentially continuing from previous segments
    - Focus on what was NEWLY DECIDED, not previously discussed decisions
    - If no NEW decisions were made, return empty decisions array
    - Reference but don't repeat information from previous summaries`,
    realtimePrompt: "Extract ONLY the NEW decisions made in this segment that were NOT covered in previous analysis.",
    incrementalPrompt: (previousSummary) => {
      return `\n\nPREVIOUS SEGMENT ANALYSIS TO AVOID REPEATING:\n${previousSummary}\n\nFocus ONLY on NEW decisions in this current segment.`;
    }
  },
  
  // Final comprehensive analysis
  final: {
    complexity: 'comprehensive',
    systemPrompt: "You are a comprehensive educational meeting analyst providing complete post-meeting analysis for student project teams.",
    analysisDepth: 'full_educational',
    outputFormat: 'final_comprehensive',
    specialInstructions: `
    IMPORTANT: This is the FINAL comprehensive analysis of the complete meeting.
    - Provide complete meeting summary covering entire duration
    - Summarize ALL decisions made throughout the meeting  
    - Check project progress against expected week milestones
    - Compare with last week's action items (if provided)
    - Identify new action items for upcoming work
    - Provide educational resources and learning materials with real URLs
    - Include progress evaluation based on project timeline
    - Focus on educational value and learning opportunities`,
    comprehensivePrompt: `Analyze the ENTIRE meeting comprehensively, providing educational insights and project progress assessment.`
  }
};


// ============= LAYER 4: OUTPUT FORMATTERS =============

/**
 * Output format templates
 */

const OUTPUT_FORMATS = {
  // For analyze.js - pure transcription
  transcript_only: {
    template: `{
      "transcript": "Complete formatted transcript with speaker identification",
      "speakers": [
        {
          "speaker_id": "Speaker A",
          "total_speaking_time": "5:23",
          "segments": 12
        }
      ],
      "total_duration": "23:45",
      "word_count": 2847
    }`,
    instructions: "Return only transcription data with speaker identification. No analysis or insights."
  },
  // Real-time decisions format
  realtime_decisions: {
    template: `{
      "decisions": [
        {
          "decision_number": 1,
          "decision": "What specific decision was made",
          "explicit_knowledge": [
            "Documented facts, data, or research supporting this decision",
            "Reference materials, specifications, or requirements mentioned"
          ],
          "tacit_knowledge": [
            "Experience-based insights shared",
            "Intuitive or emotional factors influencing the decision",
            "Past project experiences mentioned"
          ]
        }
      ]
    }`,
    instructions: "Return ONLY decisions made in this segment. Each decision must have both explicit and tacit knowledge identified. If no decisions were made, return empty decisions array."
  },

  // Final comprehensive analysis format
  final_comprehensive: {
    template: `{
      "meeting_summary": {
        "duration_overview": "Complete overview of entire meeting duration (2-3 paragraphs)",
        "key_topics_discussed": ["Topic 1", "Topic 2", "Topic 3"],
        "overall_team_dynamics": "Assessment of collaboration and participation"
      },
      "decision_summary": {
        "total_decisions": 3,
        "decisions": [
          {
            "decision_number": 1,
            "decision": "What was decided",
            "rationale": "Why this decision was made",
            "explicit_knowledge": ["Supporting facts/data"],
            "tacit_knowledge": ["Supporting experience/intuition"],
            "impact": "How this affects the project"
          }
        ]
      },
      "progress_check": {
        "current_week": "Week X",
        "expected_milestones": ["What should be completed by now"],
        "actual_progress": ["What was actually discussed/completed"],
        "alignment_status": "on_track/ahead/behind",
        "gaps_identified": ["Areas needing attention"],
        "last_week_action_review": {
          "previous_actions": ["Action items from last meeting"],
          "completion_status": ["completed/in_progress/not_started"],
          "blockers_discussed": ["Issues preventing completion"]
        }
      },
      "action_items": {
        "immediate_next_steps": [
          {
            "action": "Specific task to complete",
            "owner": "Team member responsible",
            "deadline": "When it should be done",
            "priority": "high/medium/low"
          }
        ],
        "upcoming_week_focus": ["Main priorities for next week"],
        "dependencies": ["What needs to happen before other tasks"]
      },
      "learning_materials": {
        "recommended_resources": [
          {
            "resource_type": "website/article/tool/tutorial",
            "title": "Resource name", 
            "url": "https://example.com",
            "relevance": "Why this helps with their current challenges",
            "priority": "high/medium/low"
          }
        ],
        "skill_gaps_identified": ["Areas where team needs more knowledge"],
        "module_specific_guidance": ["Advice specific to DE4 ERO requirements"],
        "suggested_next_learning": ["What to study before next meeting"]
      }
    }`,
    instructions: "Provide comprehensive analysis including all sections. Use actual URLs for learning resources when possible. Base progress check on project week milestones."
  }
};
// const OUTPUT_FORMATS = {
//   structured_summary: {
//     template: `{
//       "summary": "Concise overview of key points discussed",
//       "decisions": ["Decision 1", "Decision 2"],
//       "explicit": ["Documented fact 1", "Data point 2"],
//       "tacit": ["Experience-based insight 1", "Intuition 2"],
//       "reasoning": "Logic flow and rationale",
//       "suggestions": ["Actionable recommendation 1", "Next step 2"]
//     }`,
//     instructions: "Return ONLY valid JSON in the specified format. No additional text or markdown."
//   },
  
//   full_analysis: {
//     template: `{
//       "summary": "Comprehensive meeting overview (2-3 paragraphs)",
//       "decisions": [
//         {
//           "decision": "What was decided",
//           "context": "Why this decision was needed",
//           "rationale": "Reasoning behind the decision",
//           "supporting_knowledge": {
//             "explicit": ["Facts supporting this decision"],
//             "tacit": ["Experience/intuition supporting this decision"]
//           },
//           "owner": "Who is responsible",
//           "next_steps": ["Required actions"]
//         }
//       ],
//       "explicit": [
//         {
//           "knowledge": "Documented fact or data",
//           "speaker": "Speaker identifier",
//           "context": "How this was used in discussion"
//         }
//       ],
//       "tacit": [
//         {
//           "knowledge": "Experience or intuition shared",
//           "speaker": "Speaker identifier",
//           "context": "How this influenced discussion"
//         }
//       ],
//       "reasoning": "Overall logic flow: how the discussion progressed from problem to solution",
//       "suggestions": [
//         {
//           "recommendation": "Specific actionable suggestion",
//           "rationale": "Why this would help",
//           "resources": "Tools, methods, or materials that could help"
//         }
//       ],
//       "goal_achievement": {
//         "goals_met": ["Goals that were achieved"],
//         "goals_pending": ["Goals that need more work"],
//         "evaluation": "Overall assessment of meeting effectiveness"
//       }
//     }`,
//     instructions: "Provide detailed, structured analysis following the JSON format. Ensure all arrays contain relevant items."
//   },

//   full_analysis_with_progress: {
//   template: `{
//     "summary": "Comprehensive meeting overview (2-3 paragraphs)",
//     "decisions": [/* same as full_analysis */],
//     "explicit": [/* same as full_analysis */],
//     "tacit": [/* same as full_analysis */],
//     "reasoning": "Overall logic flow",
//     "suggestions": [/* same as full_analysis */],
//     "goal_achievement": {/* same as full_analysis */},
//     "project_progress": {
//       "current_week": "Week X",
//       "alignment_with_milestones": {
//         "on_track": ["Items completed as expected"],
//         "ahead": ["Areas where team is ahead of schedule"],
//         "behind": ["Areas needing attention"],
//         "missing": ["Expected items not discussed"]
//       },
//       "recommended_priorities": ["Specific actions for next week"],
//       "risk_factors": ["Timeline or progress risks identified"],
//       "coach_attention_points": ["Areas needing guidance"]
//     }
//   }`,
//   instructions: "Provide detailed analysis with project progress evaluation. Include specific assessment of timeline alignment."
// }
// };

// ============= MAIN PROMPT BUILDER CLASS =============

/**
 * Main class for building customized prompts
 */
class PromptBuilder {
  constructor(config = {}) {
  this.role = config.role || null;
  this.module = config.module || null;
  this.meetingType = config.meetingType || null;
  this.projectWeek = config.projectWeek || null;
  this.groupName = config.groupName || '';          
  this.groupNumber = config.groupNumber || '';    
  this.goals = config.goals || '';
  this.teamMembers = config.teamMembers || [];
  this.analysisType = config.analysisType;  
  this.previousSummary = config.previousSummary || '';
  this.lastWeekSummary = config.lastWeekSummary || '';     // 上周会议总结
  this.lastWeekActions = config.lastWeekActions || [];     // 上周的action items

  this.pdfContext = config.pdfContext || '';
}

/**
 * Builds project progress evaluation context
 */
buildProgressContext() {
  if (!this.projectWeek || !MODULE_TEMPLATES[this.module]?.weeklyMilestones) {
    return '';
  }
  
  const milestones = MODULE_TEMPLATES[this.module].weeklyMilestones;
  let weekData = milestones[this.projectWeek];
  
  // Handle range weeks like "Week 3-4"
  if (!weekData) {
    for (let key in milestones) {
      if (key.includes(this.projectWeek.split(' ')[1])) {
        weekData = milestones[key];
        break;
      }
    }
  }
  
  if (!weekData) return '';
  
  // 🔄 修改：使用变量来构建返回内容，而不是直接return
  let progressContext = `
PROJECT TIMELINE CONTEXT:
Current Project Week: ${this.projectWeek}

Expected Progress at this stage:
${weekData.expectedProgress.map(item => `- ${item}`).join('\n')}

Key Deliverables for this period:
${weekData.keyDeliverables.map(item => `- ${item}`).join('\n')}

PROGRESS EVALUATION INSTRUCTIONS:
1. Compare team's discussion against expected progress for ${this.projectWeek}
2. Identify if they are on track, ahead, or behind schedule
3. Note any missed milestones or deliverables
4. Assess quality of progress, not just completion`;

  // ➕ 新增：上周Action Items检查部分
  if (this.lastWeekActions && this.lastWeekActions.length > 0) {
    progressContext += `

PREVIOUS WEEK ACTION ITEMS REVIEW:
Check if the team discussed or completed these items from last week:
${this.lastWeekActions.map(action => `- ${action}`).join('\n')}

Evaluate:
- Which items were completed vs. still pending
- What blockers or challenges were mentioned
- How well they followed through on commitments`;
  }

  // ➕ 新增：学习材料指导部分
  progressContext += `

LEARNING MATERIALS GUIDANCE:
- Suggest specific resources based on their current challenges
- Reference the PDF context and module requirements
- Provide actual URLs when possible
- Focus on immediate needs and skill gaps identified`;

  return progressContext;
}
  /**
   * Builds the complete system prompt
   */
  buildSystemPrompt() {
    const components = [];
    
    // 1. Base system role
    const strategy = ANALYSIS_STRATEGIES[this.analysisType];
    components.push(strategy.systemPrompt);
    
    // 2. Role perspective
    const roleTemplate = ROLE_TEMPLATES[this.role];
    if (roleTemplate) {
      components.push(`\n${roleTemplate.systemRole}`);
      components.push(`Perspective: ${roleTemplate.perspective}`);
    }
    
    // 3. Module domain knowledge
    const moduleTemplate = MODULE_TEMPLATES[this.module];
    if (moduleTemplate) {
      components.push(`\nDomain Context: ${moduleTemplate.fullName}`);
      components.push(`Key concepts to watch for: ${moduleTemplate.keyConcepts.join(', ')}`);
    }
    
    // 4. Meeting type guidance
    const meetingTemplate = MEETING_TYPE_TEMPLATES[this.meetingType];
    if (meetingTemplate) {
      components.push(`\nMeeting Type: ${this.meetingType}`);
      components.push(meetingTemplate.promptGuidance);
    }
    
    // 5. Special instructions for analysis type
    components.push(`\n${strategy.specialInstructions}`);
    
    // 6. Knowledge classification guidance
    components.push(this.buildKnowledgeClassificationGuide());

    // 7. Module-specific enhancements - 添加在这里！
  components.push(this.buildEROEnhancements());
    
    return components.join('\n');
  }
  
  /**
   * Builds the user prompt with transcript and context
   */
  buildUserPrompt(transcript) {
    const components = [];

     // 1. Analysis request based on type
  if (this.analysisType === 'transcription') {
    components.push("Process this audio for accurate transcription with speaker identification.");
    components.push("Focus only on speech-to-text conversion and speaker separation.");
  } else if (this.analysisType === 'realtime') {
    components.push("Extract ONLY the NEW decisions made in this meeting segment.");
    components.push("For each NEW decision, identify the explicit knowledge (facts, data, documentation) and tacit knowledge (experience, intuition, feelings) that supported it.");
    components.push("Number each decision sequentially. If no NEW decisions were made, return an empty decisions array.");
    
    // 关键：添加previous summary来避免重复
    if (this.previousSummary) {
      components.push(ANALYSIS_STRATEGIES.realtime.incrementalPrompt(this.previousSummary));
    }
  } else if (this.analysisType === 'final') {
    components.push("Provide a comprehensive analysis of the complete meeting including summary, progress check, and learning recommendations.");
    
    // Add last week context for final analysis
    if (this.lastWeekSummary) {
      components.push(`\n\nLAST WEEK'S MEETING SUMMARY:\n${this.lastWeekSummary}`);
    }
    
    if (this.lastWeekActions && this.lastWeekActions.length > 0) {
      components.push(`\n\nLAST WEEK'S ACTION ITEMS TO CHECK:\n${this.lastWeekActions.map(action => `- ${action}`).join('\n')}`);
    }
  }
    
    
    // 2. Team context
    const teamContext = TeamContextBuilder.buildTeamContext(this.teamMembers);
    if (teamContext) {
      components.push(teamContext);
    }
    
    // 3. Meeting goals
   if (this.goals) {
    const goalContext = GoalIntegrator.parseGoals(this.goals);
    if (goalContext && goalContext.promptAddition) {
      components.push(goalContext.promptAddition);
    }
  }
    
    // 4. PDF context if available
   
if (this.pdfContext) {
  // 增加到8000字符，保留更多上下文
  const pdfExcerpt = this.pdfContext.substring(0, 8000);
  components.push(`
\nReference Document Context:
${pdfExcerpt}

INSTRUCTIONS FOR PDF USAGE:
- Use this document to verify factual claims made in the meeting
- Challenge assertions that contradict the document
- Identify gaps between team discussion and documented requirements
- Suggest relevant sections the team might have missed
`);
}
     // 4.5 Add progress evaluation for final analysis (新增)
  if (this.analysisType === 'final' && this.projectWeek) {
    components.push(this.buildProgressContext());
  }
    // 5. Output format specification
    const formatMap = {
    'transcription': OUTPUT_FORMATS.transcript_only,
    'realtime': OUTPUT_FORMATS.realtime_decisions,
    'final': OUTPUT_FORMATS.final_comprehensive
  };
  
  const format = formatMap[this.analysisType];
  components.push(`\n\nOUTPUT FORMAT REQUIREMENTS:\n${format.instructions}`);
  components.push(`\nExpected JSON Structure:\n${format.template}`);

  // The transcript/audio input
  components.push(`\n\nInput:\n${transcript}`);
  
  return components.join('\n');
  }
  
  /**
   * Builds knowledge classification guidance specific to the module
   */
  buildKnowledgeClassificationGuide() {
    const module = MODULE_TEMPLATES[this.module];
    const role = ROLE_TEMPLATES[this.role];
    
    if (!module) return '';
    
    return `
    
Knowledge Classification Guidelines:

EXPLICIT Knowledge (documented, codifiable):
- ${module.explicitMarkers.join('\n- ')}
- ${role.knowledgeFraming.explicit}

TACIT Knowledge (experiential, intuitive):
- ${module.tacitMarkers.join('\n- ')}
- ${role.knowledgeFraming.tacit}

When analyzing decisions, clearly identify which type of knowledge supports each decision.`;
  }


  /**
 * Builds DE4-ERO specific enhancements
 */
buildEROEnhancements() {
  if (this.module !== 'DE4 ERO') return '';
  
  return `

DE4-ERO SPECIFIC ANALYSIS:
- Evaluate SDG alignment in all decisions
- Assess market validation evidence quality
- Track pivot decisions and rationale
- Monitor IP considerations
- Evaluate business model viability
- Check for customer validation activities
- Assess team dynamics and task distribution`;
}
  
  /**
   * Gets decision criteria based on module
   */
  getDecisionCriteria() {
    const module = MODULE_TEMPLATES[this.module];
    return module ? module.decisionCriteria : [];
  }
  
  /**
   * Gets focus areas based on role
   */
  getFocusAreas() {
    const role = ROLE_TEMPLATES[this.role];
    return role ? role.focusAreas : [];
  }
  
  /**
   * Validates the configuration
   */
  validate() {
    const errors = [];
    
    if (!ROLE_TEMPLATES[this.role]) {
      errors.push(`Invalid role: ${this.role}`);
    }
    
    if (!MODULE_TEMPLATES[this.module]) {
      errors.push(`Invalid module: ${this.module}`);
    }
    
    if (!MEETING_TYPE_TEMPLATES[this.meetingType]) {
      errors.push(`Invalid meeting type: ${this.meetingType}`);
    }
    

    // 新增：验证周数格式
  if (this.projectWeek && !this.projectWeek.match(/^Week \d+(-\d+)?$/)) {
    errors.push(`Invalid week format: ${this.projectWeek}. Use "Week X" or "Week X-Y"`);
  }

  if (!this.analysisType) {
    errors.push('Analysis type is required');
  }
  
  if (!['transcription', 'realtime', 'final'].includes(this.analysisType)) {
    errors.push(`Invalid analysis type: ${this.analysisType}`);
  }
  
  // 新增：验证周数是否在有效范围
  if (this.projectWeek && this.module === 'DE4 ERO') {
    const weekNum = parseInt(this.projectWeek.match(/\d+/)[0]);
    if (weekNum < 1 || weekNum > 20) {
      errors.push(`Week number out of range: ${this.projectWeek}`);
    }
}
    
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// ============= UTILITY FUNCTIONS =============

/**
 * Quick function to generate prompts for different scenarios
 */
function generatePrompt(config, transcript) {
  const builder = new PromptBuilder(config);
  
  // Validate configuration
  const validation = builder.validate();
  if (!validation.isValid) {
    console.error('Invalid prompt configuration:', validation.errors);
    throw new Error(`Prompt configuration errors: ${validation.errors.join(', ')}`);
  }
  
  return {
    systemPrompt: builder.buildSystemPrompt(),
    userPrompt: builder.buildUserPrompt(transcript),
    metadata: {
      role: config.role,
      module: config.module,
      meetingType: config.meetingType,
      analysisType: config.analysisType
    }
  };
}

/**
 * Helper function for realtime analysis
 */
function generateRealtimePrompt(config, transcript) {
  return generatePrompt({
    ...config,
    analysisType: 'realtime'
  }, transcript);
}
/**
 * Helper function for final analysis
 */
function generateFinalPrompt(config, transcript) {
  return generatePrompt({
    ...config,
    analysisType: 'final'
  }, transcript);
}

// ============= EXPORTS =============

export {
  // Main builder class
  PromptBuilder,
  
  // Quick generation functions
  generatePrompt,
 generateRealtimePrompt,
  generateFinalPrompt,
  
  // Templates for reference
  ROLE_TEMPLATES,
  MODULE_TEMPLATES,
  MEETING_TYPE_TEMPLATES,
  ANALYSIS_STRATEGIES,
  OUTPUT_FORMATS,
  
  // Utility classes
  GoalIntegrator,
  TeamContextBuilder
};

// Default export
export default {
  PromptBuilder,
  generatePrompt,
  generateRealtimePrompt,
  generateFinalPrompt
};