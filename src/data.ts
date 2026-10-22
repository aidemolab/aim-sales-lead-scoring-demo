export interface LeadRaw {
  leadId: string;
  company: string;
  industry: string;
  contact: string;
  leadSource: string;
  budgetGbp: number;
  timelineMonths: number;
  decisionMakers: number;
  previousEngagement: string;
  painPointClarity: 'High' | 'Medium' | 'Low';
  fitScore: number;
  flagsStr: string;
  notes: string;
  rowId?: string; // database row id (visitor-added and sample rows)
  own?: boolean; // true for records the visitor added
}

export interface LeadCalculated extends LeadRaw {
  rank: number;
  conversionProbability: number;
  scoreCategory: 'HOT' | 'WARM' | 'COLD';
  flags: string[];
  recommendedAction: string;
  probabilityBreakdown: {
    base: number;
    budgetBonus: number;
    timelineBonus: number;
    decisionMakersBonus: number;
    engagementDeduction: number;
    lowBudgetDeduction: number;
    longTimelineDeduction: number;
    singleChampDeduction: number;
    finalScoreBeforeCap: number;
  };
  advisorText: string;
  summarySentence: string;
}

export const RAW_LEADS: LeadRaw[] = [
  {
    leadId: "L001",
    company: "Meridian Logistics",
    industry: "Logistics",
    contact: "Sarah Chen",
    leadSource: "Inbound",
    budgetGbp: 45000,
    timelineMonths: 2,
    decisionMakers: 3,
    previousEngagement: "Demo attended | Follow-up replied",
    painPointClarity: "High",
    fitScore: 92,
    flagsStr: "None",
    notes: "Strong budget and timeline. Clear pain point around route optimisation. Multiple decision makers engaged."
  },
  {
    leadId: "L002",
    company: "Apex Retail Group",
    industry: "Retail",
    contact: "James Okafor",
    leadSource: "Referral",
    budgetGbp: 38000,
    timelineMonths: 3,
    decisionMakers: 2,
    previousEngagement: "Intro call done | Proposal requested",
    painPointClarity: "High",
    fitScore: 88,
    flagsStr: "None",
    notes: "Referred by existing client. Requested proposal within 48 hours of first call. Budget confirmed."
  },
  {
    leadId: "L003",
    company: "Northgate Healthcare",
    industry: "Healthcare",
    contact: "Dr Priya Patel",
    leadSource: "Outbound",
    budgetGbp: 62000,
    timelineMonths: 6,
    decisionMakers: 5,
    previousEngagement: "Intro call done",
    painPointClarity: "Medium",
    fitScore: 74,
    flagsStr: "Long sales cycle | Many stakeholders",
    notes: "Large deal but procurement process is complex. Requires board approval. Timeline is 6 months minimum."
  },
  {
    leadId: "L004",
    company: "Falcon Manufacturing",
    industry: "Manufacturing",
    contact: "Tom Briggs",
    leadSource: "Inbound",
    budgetGbp: 28000,
    timelineMonths: 4,
    decisionMakers: 2,
    previousEngagement: "Demo attended",
    painPointClarity: "Medium",
    fitScore: 71,
    flagsStr: "Budget below average | Single champion",
    notes: "Only one internal champion identified. Budget is below average for this solution tier. Risk of stalling."
  },
  {
    leadId: "L005",
    company: "Sterling Financial",
    industry: "Finance",
    contact: "Amanda Walsh",
    leadSource: "Event",
    budgetGbp: 55000,
    timelineMonths: 3,
    decisionMakers: 4,
    previousEngagement: "No engagement since event",
    painPointClarity: "Low",
    fitScore: 58,
    flagsStr: "No follow-up | Low engagement",
    notes: "Met at industry event. No response to two follow-up emails. Pain point not clearly articulated."
  },
  {
    leadId: "L006",
    company: "Horizon EdTech",
    industry: "Education",
    contact: "Marcus Lee",
    leadSource: "Outbound",
    budgetGbp: 18000,
    timelineMonths: 8,
    decisionMakers: 1,
    previousEngagement: "Intro call done",
    painPointClarity: "Low",
    fitScore: 42,
    flagsStr: "Low budget | Long timeline | Single decision maker",
    notes: "Budget is significantly below minimum viable deal size. Timeline is 8 months. Only one decision maker."
  },
  {
    leadId: "L007",
    company: "Crestwood Legal",
    industry: "Legal",
    contact: "Fiona Grant",
    leadSource: "Inbound",
    budgetGbp: 41000,
    timelineMonths: 3,
    decisionMakers: 3,
    previousEngagement: "Demo attended | Trial requested",
    painPointClarity: "High",
    fitScore: 86,
    flagsStr: "None",
    notes: "Requested a trial after demo. Three decision makers actively involved. Clear pain point around document management."
  },
  {
    leadId: "L008",
    company: "Delta Construction",
    industry: "Construction",
    contact: "Ryan Murphy",
    leadSource: "Outbound",
    budgetGbp: 22000,
    timelineMonths: 5,
    decisionMakers: 1,
    previousEngagement: "No engagement",
    painPointClarity: "Low",
    fitScore: 35,
    flagsStr: "No engagement | Low budget | Outside core ICP",
    notes: "No response to any outreach. Budget and industry are outside core ideal customer profile. Low priority."
  }
];

export function processLeads(rawLeads: LeadRaw[] = RAW_LEADS): LeadCalculated[] {
  const calculatedLeads = rawLeads.map(lead => {
    // Parse flags
    const flags = lead.flagsStr === "None" 
      ? [] 
      : lead.flagsStr.split(" | ").map(f => f.trim());

    // Calculate Conversion Probability
    const base = lead.fitScore;
    const budgetBonus = lead.budgetGbp >= 40000 ? 5 : 0;
    const timelineBonus = lead.timelineMonths <= 3 ? 5 : 0;
    const decisionMakersBonus = lead.decisionMakers >= 3 ? 3 : 0;

    let engagementDeduction = 0;
    if (flags.includes("No engagement") || flags.includes("No follow-up") || flags.includes("Low engagement")) {
      engagementDeduction = 8;
    }

    const lowBudgetDeduction = flags.includes("Low budget") || flags.includes("Budget below average") ? 5 : 0;
    const longTimelineDeduction = flags.includes("Long sales cycle") || flags.includes("Long timeline") ? 5 : 0;
    const singleChampDeduction = flags.includes("Single decision maker") || flags.includes("Single champion") ? 3 : 0;

    const finalScoreBeforeCap = base + budgetBonus + timelineBonus + decisionMakersBonus 
      - engagementDeduction - lowBudgetDeduction - longTimelineDeduction - singleChampDeduction;

    let conversionProbability = Math.round(finalScoreBeforeCap);
    if (conversionProbability > 98) conversionProbability = 98;
    if (conversionProbability < 10) conversionProbability = 10;

    // Categorization
    // HOT — Conversion probability above 80:
    // - Fit score 80 or above
    // - Budget confirmed >= 30000
    // - Timeline <= 4 months
    // - At least 2 DMs
    // - Meaningful engagement (demo, proposal, trial)
    // - No serious risk flags
    let scoreCategory: 'HOT' | 'WARM' | 'COLD' = 'COLD';
    
    const isHot = lead.fitScore >= 80 && 
                  lead.budgetGbp >= 30000 && 
                  lead.timelineMonths <= 4 && 
                  lead.decisionMakers >= 2 && 
                  lead.flagsStr === "None" &&
                  conversionProbability >= 80;

    const isWarm = !isHot && 
                   lead.fitScore >= 60 && 
                   lead.fitScore <= 79 && 
                   conversionProbability >= 55 && 
                   conversionProbability <= 79;

    if (isHot) {
      scoreCategory = 'HOT';
    } else if (lead.fitScore >= 60 && lead.fitScore <= 79) {
      scoreCategory = 'WARM';
    } else {
      scoreCategory = 'COLD';
    }

    // Set Recommended Next Action and Advisor Text based on specific leads
    let recommendedAction = "";
    let advisorText = "";
    let summarySentence = "";

    switch (lead.leadId) {
      case "L001":
        recommendedAction = "Schedule closing call";
        summarySentence = "Highly active closing opportunity with £45k budget and 2-month timeline.";
        advisorText = "With Meridian Logistics demonstrating an exceptional Fit Score of 92%, three decision makers engaged, and an immediate 2-month timeline, this lead is in the final decision-making phase. Sarah Chen has attended the demo and replied to all follow-ups, validating strong commercial intent. The sales manager should immediately schedule a closing call to lock in contract details and pricing.";
        break;
      case "L002":
        recommendedAction = "Send proposal";
        summarySentence = "Warm referral opportunity requesting commercial terms within 48 hours.";
        advisorText = "Apex Retail Group is highly motivated, having requested a formal proposal within 48 hours of their first call. Referred by an existing client, trust is already built. We must capitalize on this fast-moving opportunity by delivering a tailored commercial proposal to James Okafor, specifying implementation milestones for their 3-month timeline.";
        break;
      case "L007":
        recommendedAction = "Initiate trial";
        summarySentence = "Strong legal prospect requesting hands-on trial following a successful demo.";
        advisorText = "Crestwood Legal has requested an active system trial following a highly successful demo. Three decision makers are actively involved, and their pain points regarding legal document management are well-clarified. Launching the trial immediately will allow Fiona Grant's team to validate security and automation, securing a rapid conversion.";
        break;
      case "L003":
        recommendedAction = "Schedule discovery call";
        summarySentence = "High-value enterprise medical lead with complex board approvals.";
        advisorText = "Northgate Healthcare represents our largest budget opportunity (£62,000) but is bottlenecked by 5 decision makers and a complex healthcare board approval cycle. Dr Priya Patel requires high-touch consultative guiding. We need to schedule a comprehensive discovery call to map stakeholders, clarify compliance prerequisites, and establish a structured evaluation roadmap.";
        break;
      case "L004":
        recommendedAction = "Clarify budget and timeline";
        summarySentence = "Stalling risk with below-average budget and only one internal champion.";
        advisorText = "Falcon Manufacturing is currently showing signs of stalling. Only one champion, Tom Briggs, is engaged, and the £28,000 budget sits below the average tier for our manufacturing solution. The sales manager should set up an immediate touchpoint to clarify their timeline and budget flexibility, while sending manufacturing ROI case studies to help Tom build internal buy-in.";
        break;
      case "L005":
        recommendedAction = "Move to nurture sequence";
        summarySentence = "Zero follow-up engagement since the industry event.";
        advisorText = "Sterling Financial is a high-value prospect that has gone entirely cold since the industry event, showing no response to our last two outreach emails. Amanda Walsh has not clearly articulated their pain points. The sales team should avoid wasting high-touch resources and instead move this lead to an automated financial services email nurture sequence to slowly rebuild brand familiarity.";
        break;
      case "L006":
        recommendedAction = "Deprioritise — revisit in 90 days";
        summarySentence = "Extremely low budget and long timeline outside core market segment.";
        advisorText = "Horizon EdTech sits far below our ideal customer profile with a budget of just £18,000 and an 8-month timeline. With only one decision maker and low fit, this account presents extremely high friction for a minimal return. We should deprioritize active sales outreach immediately and schedule a 90-day automated reminder to check for budget adjustments.";
        break;
      case "L008":
        recommendedAction = "Remove from active pipeline";
        summarySentence = "Non-responsive outbound target outside core ICP.";
        advisorText = "Delta Construction is entirely outside our core customer profile and has shown zero response to outbound campaigns. Ryan Murphy has no engaged touchpoints, and a low budget. Rather than inflating our sales metrics, we should clean up the pipeline by removing this lead to maintain strict representative focus on high-yield opportunities.";
        break;
      default: {
        // Visitor-added leads: text is generated by fixed rules from the figures entered.
        const hasEngagementFlag = flags.includes("No engagement") || flags.includes("No follow-up") || flags.includes("Low engagement");
        recommendedAction = scoreCategory === "HOT"
          ? "Schedule closing call"
          : scoreCategory === "WARM"
            ? (lead.budgetGbp >= 30000 ? "Send proposal" : "Clarify budget and timeline")
            : (hasEngagementFlag ? "Move to nurture sequence" : "Deprioritise — revisit in 90 days");
        const tone = scoreCategory === "HOT" ? "Strong" : scoreCategory === "WARM" ? "Promising" : "Low-priority";
        summarySentence = `${tone} ${lead.industry} lead with a £${lead.budgetGbp.toLocaleString("en-GB")} budget and a ${lead.timelineMonths}-month timeline.`;
        advisorText = `${lead.company} has a fit score of ${lead.fitScore}, ${lead.decisionMakers} decision maker${lead.decisionMakers === 1 ? "" : "s"} and an estimated conversion probability of ${conversionProbability}%. ${flags.length ? "Risk flags: " + flags.join(", ") + "." : "No risk flags."} Suggested next step: ${recommendedAction.toLowerCase()}. This summary is generated by fixed rules from the figures entered.`;
      }
    }

    return {
      ...lead,
      rank: 0, // Filled in sorting phase
      conversionProbability,
      scoreCategory,
      flags,
      recommendedAction,
      probabilityBreakdown: {
        base,
        budgetBonus,
        timelineBonus,
        decisionMakersBonus,
        engagementDeduction,
        lowBudgetDeduction,
        longTimelineDeduction,
        singleChampDeduction,
        finalScoreBeforeCap
      },
      advisorText,
      summarySentence
    };
  });

  // Ranking based on: score category (HOT first, WARM second, COLD last),
  // then conversion probability (highest first), then budget (highest first)
  const categoryOrder = { HOT: 3, WARM: 2, COLD: 1 };

  const sortedLeads = [...calculatedLeads].sort((a, b) => {
    // 1. Category rank (higher number first: HOT=3, WARM=2, COLD=1)
    if (categoryOrder[a.scoreCategory] !== categoryOrder[b.scoreCategory]) {
      return categoryOrder[b.scoreCategory] - categoryOrder[a.scoreCategory];
    }
    // 2. Conversion probability (highest first)
    if (b.conversionProbability !== a.conversionProbability) {
      return b.conversionProbability - a.conversionProbability;
    }
    // 3. Budget (highest first)
    return b.budgetGbp - a.budgetGbp;
  });

  // Assign ranks
  return sortedLeads.map((lead, index) => ({
    ...lead,
    rank: index + 1
  }));
}
