package com.codecraft;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@RestController 
@RequestMapping ("/api/food")
public class FoodController {
    
    @Autowired
    private FoodRepository foodRepository;

    //The 'UUID id' parameter automatically validates standard 36-character UUID formats.
    //If a malformed string is provided, Spring returns a 400 Bad Request.
    @GetMapping("/{id}")
    public ResponseEntity<?> getFoodById(@PathVariable Long id) {
        Optional<Food> food = foodRepository.findById(id);
        if (food.isPresent()) {
            return ResponseEntity.ok(food.get());
        }
        return ResponseEntity.notFound().build();
    }
}   
