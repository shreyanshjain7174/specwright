#!/bin/bash

# Demo Simulation Script for The Reasoning Engine
# Case Study: Bulk Delete Disaster
# Purpose: Live demo showing how pre-code simulation catches security bugs

set -e

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Clear screen and show title
clear
echo -e "${BOLD}==================================================================${NC}"
echo -e "${BOLD}  THE REASONING ENGINE - PRE-CODE SIMULATION${NC}"
echo -e "${BOLD}  Case Study: Bulk Delete Feature${NC}"
echo -e "${BOLD}==================================================================${NC}"
echo ""
sleep 1

# Step 1: Context Ingestion
echo -e "${YELLOW}📥 Step 1: Ingesting Context from Multiple Sources...${NC}"
echo ""
sleep 0.5

echo "  → Scanning Slack #product-requests..."
sleep 0.3
echo "    ✓ Found: Feature request for bulk delete (Oct 15, 2025)"
sleep 0.3

echo "  → Scanning Zendesk Support Tickets..."
sleep 0.3
echo "    ✓ Found: Ticket #9284 - Customer mentions permission requirements"
sleep 0.3

echo "  → Scanning GitHub Issues..."
sleep 0.3
echo "    ✓ Found: Issue #2847 - Bulk delete acceptance criteria"
sleep 0.3

echo "  → Scanning Slack #backend (engineering discussions)..."
sleep 0.3
echo "    ⚠️  Found: Thread about permission checks (buried, 200+ messages)"
sleep 0.3

echo "  → Scanning codebase for existing patterns..."
sleep 0.3
echo "    ✓ Found: deleteDocument() function with permission logic"
sleep 0.3

echo "  → Scanning compliance documentation..."
sleep 0.3
echo "    ✓ Found: legal_hold feature requirements (Q2 2025)"
sleep 0.5

echo ""
echo -e "${GREEN}✓ Context ingestion complete. 6 sources indexed.${NC}"
echo ""
sleep 1

# Step 2: Spec Generation
echo -e "${YELLOW}⚙️  Step 2: Generating Executable Specification...${NC}"
echo ""
sleep 0.5

echo "  → Analyzing user story and business context..."
sleep 0.4
echo "  → Extracting constraints from ingested context..."
sleep 0.4
echo "  → Cross-referencing with existing codebase patterns..."
sleep 0.4
echo "  → Generating verification tests..."
sleep 0.4

echo ""
echo -e "${GREEN}✓ Executable Spec generated: SPEC-2847${NC}"
echo ""
sleep 1

# Step 3: Show Key Constraint
echo -e "${BOLD}📋 Key Constraint Extracted:${NC}"
echo ""
cat <<EOF
  ${BOLD}Constraint: PERMISSION_ENFORCEMENT${NC}
    Given a document with owner = User A
    When User B attempts to bulk delete including that document
    Then the operation MUST fail for that document
    And User B MUST receive error "Insufficient permissions"

  ${BOLD}Source:${NC}
    - Zendesk #9284: "junior employees can VIEW but shouldn't DELETE"
    - Slack #backend: "Check the can_delete field on DocumentPermission"
    - Existing code: deleteDocument() validates ownership OR explicit permission
EOF
echo ""
sleep 2

# Step 4: Simulation
echo -e "${YELLOW}🧪 Step 3: Running Pre-Code Simulation...${NC}"
echo ""
sleep 0.5

echo "  Setting up virtual test environment..."
sleep 0.3
echo "  Creating test users: Alice (Admin), Bob (Team Lead), Charlie (Contributor)"
sleep 0.3
echo "  Creating shared folder 'Q4 Strategy' with permission matrix"
sleep 0.3
echo "  Creating test documents with various ownership and permissions"
sleep 0.5
echo ""

echo -e "${BOLD}  Running Test Scenarios:${NC}"
echo ""
sleep 0.5

# Scenario 1
echo "  [1/4] Authorized user bulk deletes own documents..."
sleep 0.8
echo -e "        ${GREEN}✓ PASSED${NC} - Alice deleted 2 documents successfully"
sleep 0.5

# Scenario 2 - THE CRITICAL FAILURE
echo "  [2/4] Unauthorized user attempts bulk delete..."
sleep 0.8
echo -e "        ${RED}✗ FAILED${NC} - Charlie deleted 2 documents (should have been blocked)"
sleep 0.5

# Scenario 3
echo "  [3/4] Mixed permissions in bulk selection..."
sleep 0.8
echo -e "        ${RED}✗ FAILED${NC} - Bob deleted Alice's document (should have been blocked)"
sleep 0.5

# Scenario 4
echo "  [4/4] Legal hold prevents deletion..."
sleep 0.8
echo -e "        ${RED}✗ FAILED${NC} - Alice deleted document with legal_hold=true"
sleep 1

echo ""
echo -e "${RED}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${RED}${BOLD}  🔴 SIMULATION FAILED: Critical Security Issue Detected${NC}"
echo -e "${RED}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo ""
sleep 1

# Detailed Failure Report
cat <<EOF
${RED}${BOLD}Test Case:${NC} "Unauthorized user attempts bulk delete"

${RED}${BOLD}Expected Result:${NC}
  - 0 documents deleted
  - 2 permission failures
  - Error: "Insufficient permissions"

${RED}${BOLD}Actual Result:${NC}
  - 2 documents deleted
  - 0 failures
  - Status: 200 OK

${RED}${BOLD}❌ CONSTRAINT VIOLATION: PERMISSION_ENFORCEMENT${NC}

  User Charlie (role: Contributor) successfully deleted:
    • budget.xlsx (owner: Alice)
    • roadmap.pdf (owner: Bob)

  Charlie's permissions:
    can_view: true
    can_edit: true
    can_delete: ${RED}false${NC} ← VIOLATED

  ${RED}Expected: 403 Unauthorized${NC}
  ${RED}Actual: 200 OK${NC}

EOF
sleep 2

# Root Cause
echo -e "${BOLD}🔍 Root Cause Analysis:${NC}"
echo ""
cat <<EOF
  Proposed implementation calls ${RED}db.documents.deleteMany()${NC} directly
  without permission validation.

  This bypasses the permission checks in the existing
  ${GREEN}deleteDocument()${NC} function which properly validates:
    1. Document ownership
    2. Explicit can_delete permission
    3. Legal hold status

  The bulk implementation creates a SEPARATE permission path
  that violates the PERMISSION_PARITY constraint.
EOF
echo ""
sleep 2

# Blast Radius
echo -e "${BOLD}📊 Blast Radius Estimation:${NC}"
echo ""
cat <<EOF
  • Affects: All shared folders (40% of enterprise workspaces)
  • At-Risk Documents: ~10,000 across 50 customers
  • Compliance Impact: SOC2 requirement violation (access controls)
  • Estimated Incident Cost: $220,000
    - Customer churn: $180K ARR
    - Emergency engineering: $30K (1 week, 3 engineers)
    - Data restoration: $10K
    - Brand damage: Immeasurable
EOF
echo ""
sleep 2

# Recommended Fix
echo -e "${BOLD}💡 Recommended Fix:${NC}"
echo ""
echo -e "${RED}Instead of:${NC}"
cat <<EOF
  async function bulkDeleteDocuments(documentIds) {
    await db.documents.deleteMany({
      where: { id: { in: documentIds }}
    });
  }
EOF
echo ""
echo -e "${GREEN}Use this:${NC}"
cat <<EOF
  async function bulkDeleteDocuments(documentIds, userId) {
    const results = await Promise.all(
      documentIds.map(id => 
        deleteDocument(id, userId) // Reuses existing permission logic
      )
    );
    
    return {
      deleted: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success)
    };
  }
EOF
echo ""
sleep 2

# Prevention Summary
echo -e "${BOLD}⏱️  Estimated Prevention Impact:${NC}"
echo ""
cat <<EOF
  ${GREEN}✓${NC} Prevented: 1 week emergency bug fix
  ${GREEN}✓${NC} Prevented: 2 customer churns ($180K ARR)
  ${GREEN}✓${NC} Prevented: 40 hours data restoration
  ${GREEN}✓${NC} Prevented: TechCrunch negative press
  ${GREEN}✓${NC} Prevented: SOC2 compliance violation

  ${BOLD}Cost to fix NOW (pre-code): 3 extra dev days ($5K)${NC}
  ${BOLD}Cost to fix AFTER incident: $220K + reputation damage${NC}

  ${GREEN}${BOLD}ROI: 4,400%${NC}
EOF
echo ""
sleep 2

# Final Message
echo -e "${BOLD}==================================================================${NC}"
echo -e "${GREEN}${BOLD}  ✅ SIMULATION COMPLETE${NC}"
echo -e "${BOLD}==================================================================${NC}"
echo ""
echo "The bug that would have caused a \$220K disaster was caught"
echo "BEFORE a single line of code was written."
echo ""
echo "This is the power of Executable Specifications + Pre-Code Simulation."
echo ""
echo -e "${YELLOW}Next Step: Review spec with engineering team before implementation.${NC}"
echo ""

# Option to see full spec
echo -e "Press ${BOLD}[Enter]${NC} to see the full Executable Spec, or ${BOLD}[Ctrl+C]${NC} to exit..."
read -r

# Show abbreviated spec
clear
echo -e "${BOLD}==================================================================${NC}"
echo -e "${BOLD}  EXECUTABLE SPECIFICATION: SPEC-2847${NC}"
echo -e "${BOLD}==================================================================${NC}"
echo ""

cat <<EOF
${BOLD}Title:${NC} Bulk Delete for Documents with Permission Validation

${BOLD}Status:${NC} ⚠️  Pre-Implementation (Simulation Failed - Requires Revision)

${BOLD}Narrative Layer:${NC}
  Enterprise customers managing 1,000+ documents need to bulk delete
  files when projects end, while maintaining strict permission controls.

${BOLD}Context Pointers:${NC}
  📎 Slack: #product-requests/thread/bulk-delete-oct15
  📎 Zendesk: Support Ticket #9284
  📎 GitHub: Issue #2847
  📎 Codebase: src/services/documents.service.ts:deleteDocument()
  📎 Compliance: Legal Hold Feature Spec (Q2 2025)

${BOLD}Constraint Layer (MUST NOT VIOLATE):${NC}
  ✓ PERMISSION_ENFORCEMENT
  ✓ LEGAL_HOLD_PROTECTION  
  ✓ ATOMIC_FEEDBACK
  ✓ PERMISSION_PARITY

${BOLD}Verification Layer:${NC}
  ✓ 5 Gherkin test scenarios
  ✓ Pre-code simulation results
  ✗ 3 critical failures detected

${BOLD}Recommended Action:${NC}
  Revise implementation to reuse existing deleteDocument() logic
  instead of creating separate bulk deletion path.

  Estimated revised timeline: 7 days (vs original 4 days)
  Prevention value: \$220K

${BOLD}Approval Status:${NC}
  ⏸️  Pending PM review of simulation results
EOF

echo ""
echo -e "${BOLD}==================================================================${NC}"
echo ""
echo "For full spec: reasoning-engine/docs/case-studies/02-public-case-study.md"
echo ""
