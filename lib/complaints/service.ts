import { createClient } from '@supabase/supabase-js';
import { Complaint, ComplaintResponse, ComplaintEscalation, ComplaintResolution, ComplaintFeedback, ComplaintAnalytics, FeedbackSurvey, SurveyResponse, ComplaintStatistics, ComplaintCategory } from '@/types';

let supabaseClient: any = null;

function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.warn('Supabase environment variables not set');
      return null;
    }

    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

// COMPLAINT CATEGORIES
export async function getComplaintCategories(): Promise<ComplaintCategory[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('complaint_categories')
      .select('*')
      .eq('is_active', true)
      .order('category_name');

    if (error) throw error;
    return (data || []) as ComplaintCategory[];
  } catch (err) {
    console.error('Error fetching complaint categories:', err);
    return [];
  }
}

// CREATE COMPLAINT
export async function createComplaint(userId: string, complaintData: Partial<Complaint>): Promise<Complaint | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    // Generate ticket ID
    const ticketId = `TKT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const { data, error } = await supabase
      .from('complaints')
      .insert({
        user_id: userId,
        customer_id: complaintData.customerId,
        order_id: complaintData.orderId,
        complaint_ticket_id: ticketId,
        complaint_category_id: complaintData.complaintCategoryId,
        complaint_type: complaintData.complaintType,
        subject: complaintData.subject,
        description: complaintData.description,
        complaint_status: 'open',
        priority: complaintData.priority || 'medium',
        severity: complaintData.severity || 'medium',
        acknowledgment_status: 'pending',
        feedback_provided: false,
        requires_escalation: false,
        tags: complaintData.tags || [],
        attachments: complaintData.attachments,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as Complaint;
  } catch (err) {
    console.error('Error creating complaint:', err);
    return null;
  }
}

// GET COMPLAINT
export async function getComplaint(complaintId: string): Promise<Complaint | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', complaintId)
      .single();

    if (error) throw error;
    return data as Complaint;
  } catch (err) {
    console.error('Error fetching complaint:', err);
    return null;
  }
}

// GET COMPLAINTS
export async function getComplaints(userId: string, status?: string, priority?: string): Promise<Complaint[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    let query = supabase
      .from('complaints')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('complaint_status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as Complaint[];
  } catch (err) {
    console.error('Error fetching complaints:', err);
    return [];
  }
}

// ACKNOWLEDGE COMPLAINT
export async function acknowledgeComplaint(complaintId: string, acknowledgedById?: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
      .from('complaints')
      .update({
        acknowledgment_status: 'acknowledged',
        acknowledged_at: new Date(),
        acknowledged_by_id: acknowledgedById,
        updated_at: new Date(),
      })
      .eq('id', complaintId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error acknowledging complaint:', err);
    return false;
  }
}

// UPDATE COMPLAINT STATUS
export async function updateComplaintStatus(complaintId: string, newStatus: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
      .from('complaints')
      .update({
        complaint_status: newStatus,
        updated_at: new Date(),
      })
      .eq('id', complaintId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating complaint status:', err);
    return false;
  }
}

// ASSIGN COMPLAINT
export async function assignComplaint(complaintId: string, assignedToId: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
      .from('complaints')
      .update({
        assigned_to_id: assignedToId,
        assigned_at: new Date(),
        updated_at: new Date(),
      })
      .eq('id', complaintId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error assigning complaint:', err);
    return false;
  }
}

// COMPLAINT RESPONSES
export async function addComplaintResponse(complaintId: string, responseData: Partial<ComplaintResponse>): Promise<ComplaintResponse | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('complaint_responses')
      .insert({
        complaint_id: complaintId,
        responder_id: responseData.responderId,
        responder_type: responseData.responderType,
        message: responseData.message,
        attachments: responseData.attachments,
        is_internal: responseData.isInternal || false,
        response_type: responseData.responseType,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as ComplaintResponse;
  } catch (err) {
    console.error('Error adding complaint response:', err);
    return null;
  }
}

export async function getComplaintResponses(complaintId: string): Promise<ComplaintResponse[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('complaint_responses')
      .select('*')
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as ComplaintResponse[];
  } catch (err) {
    console.error('Error fetching complaint responses:', err);
    return [];
  }
}

// ESCALATION
export async function escalateComplaint(complaintId: string, escalationData: Partial<ComplaintEscalation>): Promise<ComplaintEscalation | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('complaint_escalations')
      .insert({
        complaint_id: complaintId,
        escalation_level: escalationData.escalationLevel || 1,
        escalated_from_id: escalationData.escalatedFromId,
        escalated_to_id: escalationData.escalatedToId,
        escalation_reason: escalationData.escalationReason,
        escalation_time: new Date(),
        resolved: false,
        notes: escalationData.notes,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update complaint
    await supabase
      .from('complaints')
      .update({
        requires_escalation: true,
        escalation_reason: escalationData.escalationReason,
        escalated_at: new Date(),
        escalated_to_id: escalationData.escalatedToId,
        updated_at: new Date(),
      })
      .eq('id', complaintId);

    return data as ComplaintEscalation;
  } catch (err) {
    console.error('Error escalating complaint:', err);
    return null;
  }
}

export async function getComplaintEscalations(complaintId: string): Promise<ComplaintEscalation[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('complaint_escalations')
      .select('*')
      .eq('complaint_id', complaintId)
      .order('escalation_time', { ascending: false });

    if (error) throw error;
    return (data || []) as ComplaintEscalation[];
  } catch (err) {
    console.error('Error fetching escalations:', err);
    return [];
  }
}

// RESOLUTION
export async function resolveComplaint(complaintId: string, resolutionData: Partial<ComplaintResolution>): Promise<ComplaintResolution | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('complaint_resolutions')
      .insert({
        complaint_id: complaintId,
        resolution_type: resolutionData.resolutionType,
        resolution_description: resolutionData.resolutionDescription,
        compensation_offered: resolutionData.compensationOffered,
        compensation_type: resolutionData.compensationType,
        refund_amount: resolutionData.refundAmount,
        replacement_offered: resolutionData.replacementOffered || false,
        store_credit_amount: resolutionData.storeCreditAmount,
        actions_taken: resolutionData.actionsTaken,
        resolved_by_id: resolutionData.resolvedById,
        resolution_date: new Date(),
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update complaint status
    await supabase
      .from('complaints')
      .update({
        complaint_status: 'resolved',
        resolution_summary: resolutionData.resolutionDescription,
        resolution_date: new Date(),
        resolved_by_id: resolutionData.resolvedById,
        updated_at: new Date(),
      })
      .eq('id', complaintId);

    return data as ComplaintResolution;
  } catch (err) {
    console.error('Error resolving complaint:', err);
    return null;
  }
}

export async function getComplaintResolution(complaintId: string): Promise<ComplaintResolution | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('complaint_resolutions')
      .select('*')
      .eq('complaint_id', complaintId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as ComplaintResolution | null;
  } catch (err) {
    console.error('Error fetching resolution:', err);
    return null;
  }
}

// COMPLAINT FEEDBACK
export async function submitComplaintFeedback(feedbackData: Partial<ComplaintFeedback>): Promise<ComplaintFeedback | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('complaint_feedback')
      .insert({
        complaint_id: feedbackData.complaintId,
        customer_id: feedbackData.customerId,
        satisfaction_rating: feedbackData.satisfactionRating,
        response_quality_rating: feedbackData.responseQualityRating,
        resolution_effectiveness_rating: feedbackData.resolutionEffectivenessRating,
        communication_rating: feedbackData.communicationRating,
        overall_experience_rating: feedbackData.overallExperienceRating,
        feedback_comments: feedbackData.feedbackComments,
        would_recommend: feedbackData.wouldRecommend,
        nps_score: feedbackData.npsScore,
        follow_up_required: feedbackData.followUpRequired || false,
        follow_up_reason: feedbackData.followUpReason,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update complaint feedback status
    await supabase
      .from('complaints')
      .update({
        feedback_provided: true,
        satisfaction_rating: feedbackData.satisfactionRating,
        updated_at: new Date(),
      })
      .eq('id', feedbackData.complaintId);

    return data as ComplaintFeedback;
  } catch (err) {
    console.error('Error submitting feedback:', err);
    return null;
  }
}

export async function getComplaintFeedback(complaintId: string): Promise<ComplaintFeedback | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('complaint_feedback')
      .select('*')
      .eq('complaint_id', complaintId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as ComplaintFeedback | null;
  } catch (err) {
    console.error('Error fetching feedback:', err);
    return null;
  }
}

// COMPLAINT ANALYTICS
export async function recordComplaintAnalytics(userId: string, analyticsData: Partial<ComplaintAnalytics>): Promise<ComplaintAnalytics | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('complaint_analytics')
      .insert({
        user_id: userId,
        period_start_date: analyticsData.periodStartDate,
        period_end_date: analyticsData.periodEndDate,
        total_complaints: analyticsData.totalComplaints || 0,
        open_complaints: analyticsData.openComplaints || 0,
        resolved_complaints: analyticsData.resolvedComplaints || 0,
        average_resolution_days: analyticsData.averageResolutionDays,
        average_satisfaction_rating: analyticsData.averageSatisfactionRating,
        complaint_rate: analyticsData.complaintRate,
        top_complaint_reason: analyticsData.topComplaintReason,
        escalation_rate: analyticsData.escalationRate,
        customer_satisfaction_score: analyticsData.customerSatisfactionScore,
        complaint_by_category: analyticsData.complaintByCategory,
        complaint_by_priority: analyticsData.complaintByPriority,
        resolution_by_type: analyticsData.resolutionByType,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as ComplaintAnalytics;
  } catch (err) {
    console.error('Error recording analytics:', err);
    return null;
  }
}

export async function getComplaintAnalytics(userId: string, days: number = 30): Promise<ComplaintAnalytics[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('complaint_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('period_start_date', startDate.toISOString())
      .order('period_start_date', { ascending: false });

    if (error) throw error;
    return (data || []) as ComplaintAnalytics[];
  } catch (err) {
    console.error('Error fetching analytics:', err);
    return [];
  }
}

// COMPLAINT STATISTICS
export async function getComplaintStatistics(userId: string): Promise<ComplaintStatistics | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    // Get all complaints
    const { data: allComplaints } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', userId);

    if (!allComplaints || allComplaints.length === 0) {
      return {
        totalComplaints: 0,
        openComplaints: 0,
        resolvedComplaints: 0,
        resolutionRate: 0,
        averageSatisfactionRating: 0,
        averageResolutionTime: 0,
        escalationRate: 0,
        topComplaintType: 'N/A',
        topComplaintReason: 'N/A',
        customerSatisfactionScore: 0,
      };
    }

    const totalComplaints = allComplaints.length;
    const openComplaints = allComplaints.filter(c => c.complaint_status === 'open').length;
    const resolvedComplaints = allComplaints.filter(c => c.complaint_status === 'resolved').length;
    const escalatedComplaints = allComplaints.filter(c => c.requires_escalation).length;

    // Calculate resolution time
    const resolvedWithTime = allComplaints
      .filter(c => c.resolution_date && c.created_at)
      .map(c => {
        const created = new Date(c.created_at);
        const resolved = new Date(c.resolution_date);
        return Math.floor((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      });

    const averageResolutionTime = resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((a, b) => a + b, 0) / resolvedWithTime.length
      : 0;

    // Calculate satisfaction
    const withFeedback = allComplaints.filter(c => c.satisfaction_rating);
    const averageSatisfactionRating = withFeedback.length > 0
      ? withFeedback.reduce((sum, c) => sum + (c.satisfaction_rating || 0), 0) / withFeedback.length
      : 0;

    return {
      totalComplaints,
      openComplaints,
      resolvedComplaints,
      resolutionRate: (resolvedComplaints / totalComplaints) * 100,
      averageSatisfactionRating,
      averageResolutionTime,
      escalationRate: (escalatedComplaints / totalComplaints) * 100,
      topComplaintType: allComplaints[0]?.complaint_type || 'N/A',
      topComplaintReason: 'Multiple',
      customerSatisfactionScore: averageSatisfactionRating,
    };
  } catch (err) {
    console.error('Error fetching statistics:', err);
    return null;
  }
}

// FEEDBACK SURVEYS
export async function createSurvey(userId: string, surveyData: Partial<FeedbackSurvey>): Promise<FeedbackSurvey | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('feedback_surveys')
      .insert({
        user_id: userId,
        survey_type: surveyData.surveyType,
        survey_title: surveyData.surveyTitle,
        survey_description: surveyData.surveyDescription,
        survey_status: 'active',
        questions: surveyData.questions,
        start_date: surveyData.startDate,
        end_date: surveyData.endDate,
        target_customers: surveyData.targetCustomers,
        responses_received: 0,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as FeedbackSurvey;
  } catch (err) {
    console.error('Error creating survey:', err);
    return null;
  }
}

export async function getSurveys(userId: string): Promise<FeedbackSurvey[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('feedback_surveys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as FeedbackSurvey[];
  } catch (err) {
    console.error('Error fetching surveys:', err);
    return [];
  }
}

export async function submitSurveyResponse(responseData: Partial<SurveyResponse>): Promise<SurveyResponse | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('survey_responses')
      .insert({
        survey_id: responseData.surveyId,
        customer_id: responseData.customerId,
        responses: responseData.responses,
        rating: responseData.rating,
        comments: responseData.comments,
        response_time: responseData.responseTime,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update survey response count
    await supabase.rpc('increment_survey_responses', { survey_id: responseData.surveyId });

    return data as SurveyResponse;
  } catch (err) {
    console.error('Error submitting survey response:', err);
    return null;
  }
}

export async function getSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('survey_id', surveyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as SurveyResponse[];
  } catch (err) {
    console.error('Error fetching survey responses:', err);
    return [];
  }
}
