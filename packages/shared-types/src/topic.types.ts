export interface Topic {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  parent?: Topic | null;
  subtopics?: Topic[];
  _count?: {
    questions?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTopicDto {
  name: string;
  description?: string;
  parentId?: string;
}

export interface UpdateTopicDto {
  name?: string;
  description?: string;
  parentId?: string;
}
