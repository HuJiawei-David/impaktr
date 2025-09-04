// /home/ubuntu/impaktrweb/src/components/community/TrendingTopics.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Hash, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TrendingTopic {
  id: string;
  hashtag: string;
  posts: number;
  growth: number;
  sdgRelated?: number;
}

export function TrendingTopics() {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);

  useEffect(() => {
    // Mock data - would come from API
    setTopics([
      { id: '1', hashtag: 'climateaction', posts: 234, growth: 15, sdgRelated: 13 },
      { id: '2', hashtag: 'volunteering', posts: 189, growth: 8 },
      { id: '3', hashtag: 'sustainability', posts: 156, growth: 23, sdgRelated: 12 },
      { id: '4', hashtag: 'education', posts: 134, growth: 12, sdgRelated: 4 },
      { id: '5', hashtag: 'community', posts: 98, growth: 5 },
    ]);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Hash className="w-5 h-5 mr-2" />
          Trending Topics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topics.map((topic, index) => (
            <div key={topic.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground w-4">#{index + 1}</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">#{topic.hashtag}</span>
                    {topic.sdgRelated && (
                      <Badge variant="sdg" sdgNumber={topic.sdgRelated} className="text-xs">
                        SDG {topic.sdgRelated}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {topic.posts} posts
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1 text-green-600">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs">+{topic.growth}%</span>
              </div>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="w-full mt-3">
          View All Topics
        </Button>
      </CardContent>
    </Card>
  );
}