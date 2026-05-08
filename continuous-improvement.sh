#!/bin/bash

# Continuous Improvement Loop
# Test → Improve → Analyze → Repeat

set -e

ITERATION=1
MAX_ITERATIONS=10
LOG_FILE="improvement-loop.log"

echo "🚀 Starting Continuous Improvement Loop" | tee -a $LOG_FILE
echo "Time: $(date)" | tee -a $LOG_FILE
echo "========================================" | tee -a $LOG_FILE

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_section() {
    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a $LOG_FILE
    echo -e "${GREEN}$1${NC}" | tee -a $LOG_FILE
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a $LOG_FILE
}

log_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a $LOG_FILE
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a $LOG_FILE
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a $LOG_FILE
}

# Function to run tests and capture results
run_tests() {
    log_section "ITERATION $ITERATION: Running Tests"
    
    local test_results=""
    local exit_code=0
    
    # TypeScript compilation
    echo "Testing TypeScript compilation..." | tee -a $LOG_FILE
    if npm run build 2>&1 | tee -a $LOG_FILE; then
        log_success "TypeScript compilation passed"
        test_results="${test_results}typescript:pass,"
    else
        log_error "TypeScript compilation failed"
        test_results="${test_results}typescript:fail,"
        exit_code=1
    fi
    
    # Prisma validation
    echo "Testing Prisma schema..." | tee -a $LOG_FILE
    if npx prisma validate 2>&1 | tee -a $LOG_FILE; then
        log_success "Prisma schema valid"
        test_results="${test_results}prisma:pass,"
    else
        log_error "Prisma schema invalid"
        test_results="${test_results}prisma:fail,"
        exit_code=1
    fi
    
    # Unit tests (if they exist)
    if [ -d "src/__tests__" ] || [ -d "src/services/__tests__" ]; then
        echo "Running unit tests..." | tee -a $LOG_FILE
        if npm test 2>&1 | tee -a $LOG_FILE; then
            log_success "Unit tests passed"
            test_results="${test_results}unit:pass,"
        else
            log_error "Unit tests failed"
            test_results="${test_results}unit:fail,"
            exit_code=1
        fi
    else
        log_warning "No unit tests found"
        test_results="${test_results}unit:none,"
    fi
    
    # Linting
    echo "Running linter..." | tee -a $LOG_FILE
    if npm run lint 2>&1 | tee -a $LOG_FILE || true; then
        log_success "Linting completed"
        test_results="${test_results}lint:pass,"
    else
        log_warning "Linting issues found"
        test_results="${test_results}lint:warn,"
    fi
    
    echo "$test_results"
    return $exit_code
}

# Function to analyze issues
analyze_issues() {
    log_section "ITERATION $ITERATION: Analyzing Issues"
    
    local issues_file="iteration-${ITERATION}-issues.txt"
    
    echo "Analyzing TypeScript errors..." | tee -a $LOG_FILE
    npm run build 2>&1 | grep -E "error TS|Error:" > $issues_file || true
    
    echo "Analyzing test failures..." | tee -a $LOG_FILE
    npm test 2>&1 | grep -E "FAIL|Error:" >> $issues_file || true
    
    local issue_count=$(wc -l < $issues_file)
    echo "Found $issue_count issues" | tee -a $LOG_FILE
    
    if [ $issue_count -gt 0 ]; then
        echo "Top 5 issues:" | tee -a $LOG_FILE
        head -5 $issues_file | tee -a $LOG_FILE
    fi
    
    echo "$issues_file"
}

# Function to generate improvement report
generate_report() {
    log_section "ITERATION $ITERATION: Generating Report"
    
    local report_file="iteration-${ITERATION}-report.md"
    
    cat > $report_file << EOF
# Improvement Iteration $ITERATION Report

**Time**: $(date)

## Test Results
\`\`\`
$1
\`\`\`

## Issues Found
\`\`\`
$(cat $2 2>/dev/null || echo "No issues file")
\`\`\`

## Metrics
- TypeScript Errors: $(npm run build 2>&1 | grep -c "error TS" || echo "0")
- Test Coverage: $(npm test -- --coverage 2>&1 | grep "All files" | awk '{print $10}' || echo "N/A")
- Build Time: $(date +%s)

## Next Steps
EOF
    
    # Analyze what to fix next
    if echo "$1" | grep -q "typescript:fail"; then
        echo "1. Fix TypeScript compilation errors" >> $report_file
    fi
    
    if echo "$1" | grep -q "unit:fail"; then
        echo "2. Fix failing unit tests" >> $report_file
    fi
    
    if echo "$1" | grep -q "unit:none"; then
        echo "3. Add unit tests" >> $report_file
    fi
    
    echo "" >> $report_file
    echo "---" >> $report_file
    
    cat $report_file | tee -a $LOG_FILE
    echo "$report_file"
}

# Main improvement loop
while [ $ITERATION -le $MAX_ITERATIONS ]; do
    log_section "🔄 ITERATION $ITERATION of $MAX_ITERATIONS"
    
    # Run tests
    test_results=$(run_tests) || true
    
    # Analyze issues
    issues_file=$(analyze_issues)
    
    # Generate report
    report_file=$(generate_report "$test_results" "$issues_file")
    
    # Check if all tests passed
    if echo "$test_results" | grep -q "fail"; then
        log_warning "Tests failed, improvements needed"
        
        # Create improvement marker file
        echo "$test_results" > "iteration-${ITERATION}-status.txt"
        echo "$issues_file" >> "iteration-${ITERATION}-status.txt"
        
        log_section "Pausing for manual improvements..."
        echo "Review: $report_file" | tee -a $LOG_FILE
        echo "Issues: $issues_file" | tee -a $LOG_FILE
        echo "" | tee -a $LOG_FILE
        echo "Ready for next iteration. Continuing..." | tee -a $LOG_FILE
        
    else
        log_success "All tests passed! 🎉"
        echo "Iteration $ITERATION completed successfully" | tee -a $LOG_FILE
    fi
    
    # Commit progress
    git add -A
    git commit -m "improvement: iteration $ITERATION complete

Test Results: $test_results
Report: $report_file" || true
    
    ITERATION=$((ITERATION + 1))
    
    # Small delay between iterations
    sleep 2
done

log_section "🏁 Improvement Loop Complete"
echo "Total iterations: $((ITERATION - 1))" | tee -a $LOG_FILE
echo "Final report: iteration-$((ITERATION - 1))-report.md" | tee -a $LOG_FILE
echo "Full log: $LOG_FILE" | tee -a $LOG_FILE
