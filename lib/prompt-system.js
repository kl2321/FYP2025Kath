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
  // For analyze.js - simple transcription
  transcription: {
    complexity: 'minimal',
    systemPrompt: "You are a transcription assistant. Focus only on accurate speech-to-text conversion and speaker identification.",
    analysisDepth: 'none',
    outputFormat: 'transcript_only'
  },
  
  // For summarize.js - intermediate summaries
  intermediate: {
    complexity: 'medium',
    systemPrompt: "You are an incremental meeting analyzer. Focus on new developments and avoid repeating previous summaries.",
    analysisDepth: 'incremental',
    outputFormat: 'structured_summary',
    specialInstructions: `
    IMPORTANT: This is an intermediate summary of a ongoing meeting.
    - Only summarize NEW content that appears in this segment
    - Reference but don't repeat information from previous summaries
    - Mark significant progress or direction changes
    - Maintain continuity with earlier analysis
    - Flag items that need follow-up in the final analysis`,
    incrementalPrompt: (previousSummary) => {
      return `\n\nPrevious summary to avoid repeating:\n${previousSummary}\n\nFocus on what's NEW in this segment.`;
    }
  },
  
  // For final-analyze.js - comprehensive analysis
  final: {
    complexity: 'high',
    systemPrompt: "You are a comprehensive meeting analyst providing deep insights and actionable recommendations.",
    analysisDepth: 'comprehensive',
    outputFormat: 'full_analysis',
    specialInstructions: `
    IMPORTANT: This is the FINAL comprehensive analysis of the complete meeting.
- Provide holistic insights across the entire discussion
- Identify patterns and connections throughout the meeting
- For EVERY decision made, you MUST:
  * Clearly identify the explicit knowledge supporting it (data, facts, documents)
  * Clearly identify the tacit knowledge supporting it (experience, intuition, feelings)
  * If a decision lacks either type, explicitly note this gap
  * Assess the balance between explicit and tacit support
- Trace decision-making processes and rationale
- Evaluate goal achievement and meeting effectiveness
- Provide specific, actionable recommendations
- If project week is provided, assess progress against expected milestones`,
    comprehensivePrompt: `Analyze the ENTIRE meeting comprehensively, identifying key themes, decisions, and knowledge shared throughout.`
  }
};

// ============= LAYER 4: OUTPUT FORMATTERS =============

/**
 * Output format templates
 */
const OUTPUT_FORMATS = {
  structured_summary: {
    template: `{
      "summary": "Concise overview of key points discussed",
      "decisions": ["Decision 1", "Decision 2"],
      "explicit": ["Documented fact 1", "Data point 2"],
      "tacit": ["Experience-based insight 1", "Intuition 2"],
      "reasoning": "Logic flow and rationale",
      "suggestions": ["Actionable recommendation 1", "Next step 2"]
    }`,
    instructions: "Return ONLY valid JSON in the specified format. No additional text or markdown."
  },
  
  full_analysis: {
    template: `{
      "summary": "Comprehensive meeting overview (2-3 paragraphs)",
      "decisions": [
        {
          "decision": "What was decided",
          "context": "Why this decision was needed",
          "rationale": "Reasoning behind the decision",
          "supporting_knowledge": {
            "explicit": ["Facts supporting this decision"],
            "tacit": ["Experience/intuition supporting this decision"]
          },
          "owner": "Who is responsible",
          "next_steps": ["Required actions"]
        }
      ],
      "explicit": [
        {
          "knowledge": "Documented fact or data",
          "speaker": "Speaker identifier",
          "context": "How this was used in discussion"
        }
      ],
      "tacit": [
        {
          "knowledge": "Experience or intuition shared",
          "speaker": "Speaker identifier",
          "context": "How this influenced discussion"
        }
      ],
      "reasoning": "Overall logic flow: how the discussion progressed from problem to solution",
      "suggestions": [
        {
          "recommendation": "Specific actionable suggestion",
          "rationale": "Why this would help",
          "resources": "Tools, methods, or materials that could help"
        }
      ],
      "goal_achievement": {
        "goals_met": ["Goals that were achieved"],
        "goals_pending": ["Goals that need more work"],
        "evaluation": "Overall assessment of meeting effectiveness"
      }
    }`,
    instructions: "Provide detailed, structured analysis following the JSON format. Ensure all arrays contain relevant items."
  },

  full_analysis_with_progress: {
  template: `{
    "summary": "Comprehensive meeting overview (2-3 paragraphs)",
    "decisions": [/* same as full_analysis */],
    "explicit": [/* same as full_analysis */],
    "tacit": [/* same as full_analysis */],
    "reasoning": "Overall logic flow",
    "suggestions": [/* same as full_analysis */],
    "goal_achievement": {/* same as full_analysis */},
    "project_progress": {
      "current_week": "Week X",
      "alignment_with_milestones": {
        "on_track": ["Items completed as expected"],
        "ahead": ["Areas where team is ahead of schedule"],
        "behind": ["Areas needing attention"],
        "missing": ["Expected items not discussed"]
      },
      "recommended_priorities": ["Specific actions for next week"],
      "risk_factors": ["Timeline or progress risks identified"],
      "coach_attention_points": ["Areas needing guidance"]
    }
  }`,
  instructions: "Provide detailed analysis with project progress evaluation. Include specific assessment of timeline alignment."
}
};

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
  this.goals = config.goals || '';
  this.teamMembers = config.teamMembers || [];
  this.analysisType = config.analysisType || 'final';  // 这个可以保留默认值
  this.previousSummary = config.previousSummary || '';
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
  
  return `
PROJECT TIMELINE CONTEXT:
Current Project Week: ${this.projectWeek}

Expected Progress at this stage:
${weekData.expectedProgress.map(item => `- ${item}`).join('\n')}

Key Deliverables for this period:
${weekData.keyDeliverables.map(item => `- ${item}`).join('\n')}

EVALUATION INSTRUCTIONS:
1. Assess whether the team's discussion aligns with expected progress for ${this.projectWeek}
2. Identify any gaps between expected and actual progress
3. Note if the team is ahead, on track, or behind schedule
4. Provide specific recommendations to address any gaps
5. Suggest priorities for the coming week based on their current status`;
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
    
    // 1. Analysis request
    if (this.analysisType === 'intermediate') {
      components.push("Analyze this meeting segment and provide an incremental update.");
      if (this.previousSummary) {
        components.push(ANALYSIS_STRATEGIES.intermediate.incrementalPrompt(this.previousSummary));
      }
    } else {
      components.push(ANALYSIS_STRATEGIES.final.comprehensivePrompt);
    }
    
    // 2. Team context
    const teamContext = TeamContextBuilder.buildTeamContext(this.teamMembers);
    if (teamContext) {
      components.push(teamContext);
    }
    
    // 3. Meeting goals
    const goalContext = GoalIntegrator.parseGoals(this.goals);
    if (goalContext && goalContext.promptAddition) {
      components.push(goalContext.promptAddition);
    }
    
    // 4. PDF context if available
    if (this.pdfContext) {
      components.push(`\n\nReference Document Context:\n${this.pdfContext.substring(0, 2000)}...\n[Use this to verify or challenge team's assertions]`);
    }
     // 4.5 Add progress evaluation for final analysis (新增)
  if (this.analysisType === 'final' && this.projectWeek) {
    components.push(this.buildProgressContext());
  }
    // 5. Output format specification
    const format = this.analysisType === 'intermediate' 
      ? OUTPUT_FORMATS.structured_summary 
      : OUTPUT_FORMATS.full_analysis_with_progress;
    
    components.push(`\n\nOutput Format Requirements:\n${format.instructions}`);
    components.push(`\nExpected JSON Structure:\n${format.template}`);
    
    // 6. The actual transcript
    components.push(`\n\nMeeting Transcript:\n${transcript}`);
    
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
    
    if (!['intermediate', 'final', 'transcription'].includes(this.analysisType)) {
      errors.push(`Invalid analysis type: ${this.analysisType}`);
    }

    // 新增：验证周数格式
  if (this.projectWeek && !this.projectWeek.match(/^Week \d+(-\d+)?$/)) {
    errors.push(`Invalid week format: ${this.projectWeek}. Use "Week X" or "Week X-Y"`);
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
 * Helper function for intermediate summaries
 */
function generateIntermediatePrompt(config, transcript, previousSummary = '') {
  return generatePrompt({
    ...config,
    analysisType: 'intermediate',
    previousSummary
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
  generateIntermediatePrompt,
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
  generateIntermediatePrompt,
  generateFinalPrompt
};