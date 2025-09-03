// home/ubuntu/impaktrweb/src/components/home/TestimonialsSection.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, Award, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'Software Engineer',
    company: 'Tech for Good Malaysia',
    avatar: '/testimonials/sarah.jpg',
    impaktrScore: 847,
    rank: 'Ambassador',
    badges: 12,
    quote: 'Impaktr transformed how I track my volunteer work. Having a verified score helped me land my dream job at a socially conscious company. The platform makes social impact tangible and career-relevant.',
    sdgFocus: [4, 8, 9],
    rating: 5,
    featured: true
  },
  {
    id: 2,
    name: 'Dr. Ahmad Hassan',
    role: 'Director of CSR',
    company: 'Maybank Foundation',
    avatar: '/testimonials/ahmad.jpg',
    impaktrScore: 92,
    rank: 'ESG Champion',
    badges: 8,
    quote: 'Our corporate team uses Impaktr to coordinate all CSR activities. The ESG reports are exactly what we need for stakeholder presentations. Employee engagement increased by 300% since implementation.',
    sdgFocus: [1, 4, 10],
    rating: 5,
    featured: true
  },
  {
    id: 3,
    name: 'Maria Santos',
    role: 'University Student',
    company: 'University of Malaya',
    avatar: '/testimonials/maria.jpg',
    impaktrScore: 234,
    rank: 'Advocate',
    badges: 6,
    quote: 'As a student, Impaktr helps me build a portfolio of verified community service. I can share my impact certificates on LinkedIn and with scholarship applications. It\'s like a resume for social good!',
    sdgFocus: [3, 5, 16],
    rating: 5,
    featured: false
  },
  {
    id: 4,
    name: 'Raj Patel',
    role: 'Founder',
    company: 'Green Earth NGO',
    avatar: '/testimonials/raj.jpg',
    impaktrScore: 78,
    rank: 'CSR Leader',
    badges: 15,
    quote: 'Finding reliable volunteers was always a challenge. Impaktr connects us with committed people who actually show up. The verification system ensures quality and builds trust with our donors.',
    sdgFocus: [13, 14, 15],
    rating: 5,
    featured: true
  },
  {
    id: 5,
    name: 'Lisa Wong',
    role: 'HR Manager',
    company: 'Shopee',
    avatar: '/testimonials/lisa.jpg',
    impaktrScore: 156,
    rank: 'Changemaker',
    badges: 9,
    quote: 'We now consider Impaktr Scores in our hiring process. Candidates with high verified impact scores often demonstrate the values and commitment we look for. It\'s revolutionizing talent acquisition.',
    sdgFocus: [8, 9, 10],
    rating: 5,
    featured: false
  },
  {
    id: 6,
    name: 'Prof. David Lim',
    role: 'Dean of Sustainability',
    company: 'NUS Business School',
    avatar: '/testimonials/david.jpg',
    impaktrScore: 423,
    rank: 'Leader',
    badges: 11,
    quote: 'Impaktr provides the global benchmark we needed for social impact measurement. Our students can now graduate with verified impact transcripts alongside their academic ones.',
    sdgFocus: [4, 12, 17],
    rating: 5,
    featured: true
  }
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const featuredTestimonials = testimonials.filter(t => t.featured);

  // Auto-advance testimonials
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredTestimonials.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [featuredTestimonials.length, isAutoPlaying]);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredTestimonials.length);
    setIsAutoPlaying(false);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredTestimonials.length) % featuredTestimonials.length);
    setIsAutoPlaying(false);
  };

  const currentTestimonial = featuredTestimonials[currentIndex];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Success Stories
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted by Impact Makers Worldwide
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See how individuals, organizations, and companies are using Impaktr to measure, verify, and showcase their social impact
          </p>
        </div>

        {/* Featured Testimonial Slider */}
        <div className="mb-16">
          <Card className="max-w-4xl mx-auto relative overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
                
                {/* Quote Icon */}
                <div className="absolute top-8 left-8 z-10">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Quote className="w-6 h-6 text-primary" />
                  </div>
                </div>

                <div className="p-12 md:p-16 relative">
                  {/* Navigation */}
                  <div className="absolute top-1/2 -translate-y-1/2 -left-6">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full shadow-lg"
                      onClick={prevTestimonial}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="absolute top-1/2 -translate-y-1/2 -right-6">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full shadow-lg"
                      onClick={nextTestimonial}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Testimonial Content */}
                  <div className="text-center space-y-6">
                    {/* Rating */}
                    <div className="flex justify-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>

                    {/* Quote */}
                    <blockquote className="text-lg md:text-xl leading-relaxed text-foreground max-w-3xl mx-auto">
                      "{currentTestimonial.quote}"
                    </blockquote>

                    {/* Author Info */}
                    <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={currentTestimonial.avatar} alt={currentTestimonial.name} />
                          <AvatarFallback>
                            {currentTestimonial.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <div className="font-semibold">{currentTestimonial.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {currentTestimonial.role} @ {currentTestimonial.company}
                          </div>
                        </div>
                      </div>

                      {/* Impact Stats */}
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span className="font-medium">{currentTestimonial.impaktrScore}</span>
                          <span className="text-muted-foreground">Score</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Award className="w-4 h-4 text-green-500" />
                          <span className="font-medium">{currentTestimonial.badges}</span>
                          <span className="text-muted-foreground">Badges</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {currentTestimonial.rank}
                        </Badge>
                      </div>
                    </div>

                    {/* SDG Focus */}
                    <div className="flex justify-center space-x-2">
                      {currentTestimonial.sdgFocus.map((sdg) => (
                        <Badge key={sdg} variant="sdg" sdgNumber={sdg} className="text-xs">
                          SDG {sdg}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-2 mt-6">
            {featuredTestimonials.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex ? 'bg-primary w-8' : 'bg-muted-foreground/30'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>

        {/* All Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.slice(0, 6).map((testimonial) => (
            <Card key={testimonial.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                {/* Rating */}
                <div className="flex space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-sm leading-relaxed mb-4 line-clamp-4">
                  "{testimonial.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback className="text-sm">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-primary">
                      {testimonial.impaktrScore}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Score
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <h3 className="text-xl font-semibold mb-4">
            Ready to share your impact story?
          </h3>
          <a 
            href="/api/auth/login?screen_hint=signup"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Start Building Your Impact
          </a>
        </div>
      </div>
    </section>
  );
}