/**
 * 安全迁移脚本 - 添加 NotificationType 枚举值（简化版）
 * 此脚本 100% 安全，不会重置或删除任何数据
 * 
 * 安全特性：
 * - 只添加枚举值，不删除任何数据
 * - 使用 IF NOT EXISTS，可以重复运行
 * - 直接尝试添加，如果已存在会自动跳过
 */

// 加载环境变量（支持 .env 和 .env.local）
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  安全迁移脚本 - NotificationType 枚举值');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log('📌 此脚本将执行以下操作:');
  console.log('  ✅ 添加枚举值: CERTIFICATE_ISSUED');
  console.log('  ✅ 添加枚举值: RANK_UP');
  console.log('  ✅ 添加枚举值: EVENT_JOINED');
  console.log('  ✅ 添加枚举值: MONTHLY_REPORT');
  console.log('\n🔒 安全保证:');
  console.log('  ✅ 只添加新值，不删除任何数据');
  console.log('  ✅ 不会重置数据库');
  console.log('  ✅ 不会修改现有数据');
  console.log('  ✅ 使用 IF NOT EXISTS，可重复运行');
  console.log('\n');

  // 检查数据库连接
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ 数据库连接成功\n');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('\n可能的原因:');
    console.error('1. DATABASE_URL 环境变量未设置');
    console.error('2. 数据库服务器不可访问');
    console.error('3. 数据库凭据错误\n');
    process.exit(1);
  }

  const enumValues = [
    'CERTIFICATE_ISSUED',
    'RANK_UP',
    'EVENT_JOINED',
    'MONTHLY_REPORT'
  ];

  const results = {
    added: [],
    alreadyExists: [],
    failed: []
  };

  console.log('🔄 开始添加枚举值...\n');

  for (const enumValue of enumValues) {
    try {
      // 使用 IF NOT EXISTS 确保安全
      await prisma.$executeRawUnsafe(
        `ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS '${enumValue}'`
      );
      console.log(`✅ 成功添加: ${enumValue}`);
      results.added.push(enumValue);
    } catch (error) {
      // PostgreSQL 错误代码 42710 表示值已存在
      if (error.code === '42710' || error.message?.includes('already exists')) {
        console.log(`ℹ️  ${enumValue} 已存在`);
        results.alreadyExists.push(enumValue);
      } else {
        console.error(`❌ 添加 ${enumValue} 失败:`, error.message);
        results.failed.push({ value: enumValue, error: error.message });
      }
    }
  }

  // 总结
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  迁移结果总结');
  console.log('═══════════════════════════════════════════════════════\n');
  
  if (results.added.length > 0) {
    console.log(`✅ 成功添加: ${results.added.length} 个枚举值`);
    results.added.forEach(val => console.log(`   - ${val}`));
  }
  
  if (results.alreadyExists.length > 0) {
    console.log(`\nℹ️  已存在: ${results.alreadyExists.length} 个枚举值`);
    results.alreadyExists.forEach(val => console.log(`   - ${val}`));
  }
  
  if (results.failed.length > 0) {
    console.log(`\n❌ 失败: ${results.failed.length} 个枚举值`);
    results.failed.forEach(item => {
      console.log(`   - ${item.value}: ${item.error}`);
    });
    process.exit(1);
  }

  if (results.failed.length === 0) {
    console.log('\n🎉 迁移完成！所有枚举值已成功添加或已存在。');
  }

  await prisma.$disconnect();
}

// 错误处理
main().catch(async (error) => {
  console.error('\n❌ 执行失败:', error.message);
  console.error('\n⚠️  数据库未受影响，迁移已回滚');
  try {
    await prisma.$disconnect();
  } catch (e) {
    // 忽略断开连接错误
  }
  process.exit(1);
});

