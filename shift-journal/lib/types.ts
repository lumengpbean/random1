export interface Article {
  id: string
  title: string
  author: string
  excerpt: string | null
  content: string | null
  tags: string | null
  tag_color: string | null
  type: 'paper' | 'essay'
  status: 'pending' | 'reviewed' | 'approved' | 'rejected'
  file_url: string | null
  homepage: boolean | null
  contact_email: string | null
  view_count: number
  like_count: number
  created_at: string
}

export interface Review {
  id: string
  article_id: string
  reviewer_id: string
  vote: 'approve' | 'reject'
  comment: string | null
  created_at: string
}
