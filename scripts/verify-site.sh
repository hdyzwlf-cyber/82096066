#!/bin/bash
# ═══════════════════════════════════════════════════════════
# shenxiang.school 全面验证脚本
# 在你的服务器或本地电脑上运行:  bash verify-site.sh
# ═══════════════════════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
PASS="${GREEN}✅${NC}"
FAIL="${RED}❌${NC}"
WARN="${YELLOW}⚠️${NC}"

echo "═══════════════════════════════════════════════════════════"
echo "🔍 shenxiang.school 全面验证"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ─── 1. DNS 验证 ───
echo "📡 1. DNS 验证"
echo "──────────────────────────────────────────"
for domain in shenxiang.school www.shenxiang.school api.shenxiang.school cdn.shenxiang.school; do
  ip=$(dig +short $domain A 2>/dev/null | head -1)
  if [ -n "$ip" ]; then
    echo -e "  ${PASS} $domain → $ip"
  else
    echo -e "  ${FAIL} $domain → 解析失败"
  fi
done
echo ""

# ─── 2. HTTPS 连通性 ───
echo "🔒 2. HTTPS 连通性"
echo "──────────────────────────────────────────"
for url in https://www.shenxiang.school https://api.shenxiang.school; do
  code=$(curl -sI -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null)
  if [ "$code" = "200" ] || [ "$code" = "301" ] || [ "$code" = "302" ]; then
    echo -e "  ${PASS} $url → HTTP $code"
  elif [ "$code" = "403" ]; then
    echo -e "  ${WARN} $url → HTTP 403 (Cloudflare 防护触发)"
  elif [ "$code" = "000" ]; then
    echo -e "  ${FAIL} $url → 连接失败/超时"
  else
    echo -e "  ${WARN} $url → HTTP $code"
  fi
done
echo ""

# ─── 3. SSL 证书 ───
echo "🔐 3. SSL 证书验证"
echo "──────────────────────────────────────────"
for domain in www.shenxiang.school api.shenxiang.school; do
  expiry=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
  if [ -n "$expiry" ]; then
    echo -e "  ${PASS} $domain → 有效期至 $expiry"
  else
    echo -e "  ${FAIL} $domain → 证书获取失败"
  fi
done
echo ""

# ─── 4. HTTP Headers 安全 ───
echo "🛡️  4. HTTP Security Headers"
echo "──────────────────────────────────────────"
headers=$(curl -sI --max-time 10 "https://www.shenxiang.school" 2>/dev/null)

check_header() {
  local name="$1"
  local display="$2"
  if echo "$headers" | grep -qi "$name"; then
    value=$(echo "$headers" | grep -i "$name" | head -1 | cut -d: -f2- | xargs)
    echo -e "  ${PASS} $display: $value"
  else
    echo -e "  ${FAIL} $display: 缺失"
  fi
}

check_header "strict-transport-security" "HSTS"
check_header "x-frame-options" "X-Frame-Options"
check_header "x-content-type-options" "X-Content-Type-Options"
check_header "content-security-policy" "CSP"
check_header "x-xss-protection" "X-XSS-Protection"
echo ""

# ─── 5. 关键路径检测 ───
echo "🌐 5. 关键路径响应"
echo "──────────────────────────────────────────"
paths=(
  "https://www.shenxiang.school/:首页"
  "https://www.shenxiang.school/robots.txt:robots.txt"
  "https://api.shenxiang.school/api/health:Health Check"
)

for item in "${paths[@]}"; do
  url="${item%%:*}"
  desc="${item##*:}"
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null)
  if [ "$code" = "200" ]; then
    echo -e "  ${PASS} $desc ($url) → $code"
  else
    echo -e "  ${WARN} $desc ($url) → $code"
  fi
done
echo ""

# ─── 6. Docker 容器状态 ───
echo "🐳 6. Docker 容器状态"
echo "──────────────────────────────────────────"
if command -v docker &>/dev/null; then
  containers=("shenxiang-nextjs" "docker-api-1" "docker-worker-1" "dify-image-gateway" "postgres" "redis")
  for c in "${containers[@]}"; do
    status=$(docker ps --filter "name=$c" --format "{{.Status}}" 2>/dev/null)
    if [ -n "$status" ]; then
      echo -e "  ${PASS} $c → $status"
    else
      echo -e "  ${FAIL} $c → 未运行"
    fi
  done
else
  echo -e "  ${WARN} Docker 未安装或无权限"
fi
echo ""

# ─── 7. Dify Workflow 测试 ───
echo "🤖 7. Dify Workflow 连通性"
echo "──────────────────────────────────────────"
DIFY_URL="${DIFY_BASE_URL:-http://127.0.0.1:5001/v1}"
DIFY_KEY="${DIFY_API_KEY_MATH_INTENT:-}"

if [ -n "$DIFY_KEY" ]; then
  result=$(curl -s --max-time 15 -X POST "$DIFY_URL/workflows/run" \
    -H "Authorization: Bearer $DIFY_KEY" \
    -H "Content-Type: application/json" \
    -d '{"inputs":{"raw_prompt":"画一次函数y=2x+1","animation_style":"auto","duration_hint":"auto","quality":"auto"},"response_mode":"blocking","user":"verify-test"}' 2>/dev/null)
  
  if echo "$result" | grep -q "result_json"; then
    echo -e "  ${PASS} Math Intent Workflow → 正常返回 JSON"
    echo "     $(echo $result | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("data",{}).get("outputs",{}).get("result_json","")[:100])' 2>/dev/null)..."
  elif echo "$result" | grep -q "error"; then
    echo -e "  ${FAIL} Math Intent Workflow → 错误"
    echo "     $(echo $result | head -c 200)"
  else
    echo -e "  ${WARN} Math Intent Workflow → 未知响应"
  fi
else
  echo -e "  ${WARN} 未设置 DIFY_API_KEY_MATH_INTENT 环境变量，跳过"
  echo "     设置后重试: export DIFY_API_KEY_MATH_INTENT=app-xxx"
fi
echo ""

# ─── 8. Codex 网关 ───
echo "🧠 8. Codex 网关连通性"
echo "──────────────────────────────────────────"
CODEX_URL="${CODEX_GATEWAY_URL:-}"
CODEX_TOKEN="${CODEX_GATEWAY_TOKEN:-}"

if [ -n "$CODEX_URL" ] && [ -n "$CODEX_TOKEN" ]; then
  codex_result=$(curl -s --max-time 10 -X POST "$CODEX_URL/v1/responses" \
    -H "Authorization: Bearer $CODEX_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"model":"codex-mini","input":"test ping","tools":[]}' 2>/dev/null)
  
  if echo "$codex_result" | grep -q '"id"'; then
    echo -e "  ${PASS} Codex 网关 → 响应正常"
  else
    echo -e "  ${FAIL} Codex 网关 → 连接失败"
    echo "     $(echo $codex_result | head -c 200)"
  fi
else
  echo -e "  ${WARN} 未设置 CODEX_GATEWAY_URL / CODEX_GATEWAY_TOKEN，跳过"
  echo "     设置后重试: export CODEX_GATEWAY_URL=https://..."
fi
echo ""

# ─── 9. Manim 渲染能力 ───
echo "🎬 9. Manim 渲染能力"
echo "──────────────────────────────────────────"
if command -v manim &>/dev/null; then
  version=$(manim --version 2>&1 | head -1)
  echo -e "  ${PASS} Manim 已安装: $version"
  
  # 快速渲染测试
  cat > /tmp/manim_test.py << 'PYEOF'
from manim import *
class TestScene(Scene):
    def construct(self):
        self.play(Create(Circle()))
        self.wait(0.5)
PYEOF
  
  if manim render /tmp/manim_test.py TestScene -ql --format=mp4 --media_dir=/tmp/manim_test_out >/dev/null 2>&1; then
    echo -e "  ${PASS} 渲染测试 → 成功"
    rm -rf /tmp/manim_test.py /tmp/manim_test_out
  else
    echo -e "  ${FAIL} 渲染测试 → 失败"
  fi
else
  echo -e "  ${WARN} Manim 未安装"
  echo "     安装: pip install manim"
  
  # 检查 Docker 里是否有
  if docker ps --filter "name=manim" --format "{{.Names}}" 2>/dev/null | grep -q manim; then
    echo -e "  ${PASS} Manim Docker 容器运行中"
  fi
fi
echo ""

# ─── 10. 总结 ───
echo "═══════════════════════════════════════════════════════════"
echo "📊 验证完成 $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "如有 ❌ 项目，请按以下优先级修复:"
echo "  1. cdn.shenxiang.school DNS (影响视频分发)"
echo "  2. Docker 容器异常 (影响核心服务)"
echo "  3. Security Headers 缺失 (影响安全评级)"
echo "  4. Codex 网关部署 (影响 AI 生成功能)"
echo ""
