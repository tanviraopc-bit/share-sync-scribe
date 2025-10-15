package com.infy.icinema.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ratings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Rating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ratingId;

    @Column(nullable = false)
    private int ratingValue; // 1 to 5 stars

    @Column(length = 500)
    private String review; // Optional review text

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // The user who gave the rating

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie; // The movie being rated
}
