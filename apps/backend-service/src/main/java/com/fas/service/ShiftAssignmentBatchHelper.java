package com.fas.service;

import com.fas.data.entity.EmployeeShift;
import com.fas.data.repository.EmployeeShiftRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Helper hỗ trợ lưu phân ca đơn lẻ với giao dịch độc lập REQUIRES_NEW
 * để tránh rollback toàn bộ batch khi 1 phần tử thất bại (F-BE-01, DATA-002).
 */
@Component
public class ShiftAssignmentBatchHelper {

    private final EmployeeShiftRepository employeeShiftRepository;

    public ShiftAssignmentBatchHelper(EmployeeShiftRepository employeeShiftRepository) {
        this.employeeShiftRepository = employeeShiftRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW,
            rollbackFor = Exception.class,
            isolation = Isolation.READ_COMMITTED)
    public EmployeeShift saveAssignment(EmployeeShift employeeShift) {
        return employeeShiftRepository.save(employeeShift);
    }
}
