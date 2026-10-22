package com.codecraft.lovethyneighbor;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByReportTypeIgnoreCase(String reportType);

    List<Report> findByStatusIgnoreCase(String status);
}