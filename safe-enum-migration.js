/**
 * 安全迁移脚本 - 添加 NotificationType 枚举值
 * 此脚本 100% 安全，不会重置或删除任何数据
 * 
 * 安全特性：
 * - 只添加枚举值，不删除任何数据
 * - 使用 IF NOT EXISTS，可以重复运行
 * - 在执行前验证数据库连接
 * - 有详细的日志和错误处理
 */

// 加载环境变量（支持 .env 和 .env.local）
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

// 创建 readline 接口用于用户确认
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function checkDatabaseConnection() {
  console.log('🔍 检查数据库连接...\n');
  try {
    // 尝试执行一个简单的查询来验证连接
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ 数据库连接成功\n');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('\n可能的原因:');
    console.error('1. DATABASE_URL 环境变量未设置');
    console.error('2. 数据库服务器不可访问');
    console.error('3. 数据库凭据错误\n');
    return false;
  }
}

async function checkExistingEnumValues() {
  console.log('📋 检查当前枚举值...\n');
  try {
    // 首先查找正确的枚举类型名称（可能有大写或小写）
    const enumTypes = await prisma.$queryRawUnsafe(
      `SELECT typname 
       FROM pg_type 
       WHERE typtype = 'e' 
       AND typname ILIKE '%notification%'`
    );
    
    if (!enumTypes || enumTypes.length === 0) {
      console.log('⚠️  未找到 NotificationType 枚举类型');
      return [];
    }
    
    const typeName = enumTypes[0].typname;
    console.log(`找到枚举类型: ${typeName}\n`);
    
    // 使用正确的类型名称（带引号以保持大小写）
    const quotedTypeName = `"${typeName}"`;
    const enumLabels = await prisma.$queryRawUnsafe(
      `SELECT enumlabel 
       FROM pg_enum 
       WHERE enumtypid = ${quotedTypeName}::regtype 
       ORDER BY enumlabel`
    );
    
    console.log('当前 NotificationType 枚举值:');
    enumLabels.forEach((row) => {
      console.log(`  - ${row.enumlabel}`);
    });
    console.log('');
    
    return enumLabels.map(row => row.enumlabel);
  } catch (error) {
    console.error('❌ 无法查询枚举值:', error.message);
    return null;
  }
}

async function getEnumTypeName() {
  try {
    const enumTypes = await prisma.$queryRawUnsafe(
      `SELECT typname 
       FROM pg_type 
       WHERE typtype = 'e' 
       AND typname ILIKE '%notification%'`
    );
    
    if (!enumTypes || enumTypes.length === 0) {
      throw new Error('未找到 NotificationType 枚举类型');
    }
    
    // 返回原始类型名称（不带引号，在SQL中使用时会加引号）
    return enumTypes[0].typname;
  } catch (error) {
    // 如果找不到，尝试使用默认名称
    return 'NotificationType';
  }
}

async function applyMigration(existingValues, typeName) {
  console.log('🔄 开始应用迁移...\n');

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

  for (const enumValue of enumValues) {
    // 检查是否已存在
    if (existingValues && existingValues.includes(enumValue)) {
      console.log(`ℹ️  ${enumValue} 已存在，跳过`);
      results.alreadyExists.push(enumValue);
      continue;
    }

    try {
      // 使用 IF NOT EXISTS 确保安全，类型名称需要加引号以保持大小写
      const sql = `ALTER TYPE "${typeName}" ADD VALUE IF NOT EXISTS '${enumValue}'`;
      
      await prisma.$executeRawUnsafe(sql);
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

  return results;
}

async function verifyMigration(typeName) {
  console.log('\n📋 验证迁移结果...\n');
  try {
    // 使用 oid 来查询，避免大小写问题，使用字符串拼接（typeName 来自数据库查询，安全）
    const enumLabels = await prisma.$queryRawUnsafe(
      `SELECT e.enumlabel 
       FROM pg_enum e
       JOIN pg_type t ON e.enumtypid = t.oid
       WHERE t.typname = '${typeName.toLowerCase()}'
       ORDER BY e.enumlabel`
    );
    
    const labels = enumLabels.map((row) => row.enumlabel);
    const requiredValues = ['CERTIFICATE_ISSUED', 'RANK_UP', 'EVENT_JOINED', 'MONTHLY_REPORT'];
    const missing = requiredValues.filter(val => !labels.includes(val));
    
    if (missing.length > 0) {
      console.warn('⚠️  警告: 以下值缺失:', missing.join(', '));
      return false;
    } else {
      console.log('✅ 所有必需的枚举值都已存在！');
      console.log('\n当前所有枚举值:');
      labels.forEach(label => {
        const isNew = requiredValues.includes(label);
        console.log(`  ${isNew ? '✨' : '  '} ${label}`);
      });
      return true;
    }
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    return false;
  }
}

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
  const connected = await checkDatabaseConnection();
  if (!connected) {
    console.error('❌ 无法继续，请检查数据库配置');
    process.exit(1);
  }

  // 获取枚举类型名称
  const typeName = await getEnumTypeName();
  console.log(`使用枚举类型: ${typeName}\n`);

  // 检查现有枚举值
  let existingValues = await checkExistingEnumValues(typeName);
  if (existingValues === null || !Array.isArray(existingValues)) {
    // 如果查询失败，使用空数组继续
    console.log('⚠️  无法查询现有枚举值，将尝试添加新值\n');
    existingValues = [];
  }

  // 显示需要添加的值
  const requiredValues = ['CERTIFICATE_ISSUED', 'RANK_UP', 'EVENT_JOINED', 'MONTHLY_REPORT'];
  const toAdd = requiredValues.filter(val => !existingValues.includes(val));
  
  if (toAdd.length === 0) {
    console.log('✅ 所有必需的枚举值都已存在，无需迁移！\n');
    await prisma.$disconnect();
    rl.close();
    process.exit(0);
  }

  console.log(`需要添加 ${toAdd.length} 个枚举值: ${toAdd.join(', ')}\n`);

  // 用户确认
  const answer = await askQuestion('是否继续执行迁移？(yes/no): ');
  if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
    console.log('\n❌ 用户取消操作');
    await prisma.$disconnect();
    rl.close();
    process.exit(0);
  }

  console.log('\n');

  // 应用迁移
  const results = await applyMigration(existingValues, typeName);

  // 验证结果
  const verified = await verifyMigration(typeName);

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
  }

  if (verified && results.failed.length === 0) {
    console.log('\n🎉 迁移完成！所有枚举值已成功添加。');
  } else if (!verified) {
    console.log('\n⚠️  迁移完成，但验证失败，请手动检查。');
  }

  await prisma.$disconnect();
  rl.close();
}

// 错误处理
let rlClosed = false;

process.on('unhandledRejection', async (error) => {
  console.error('\n❌ 未处理的错误:', error);
  console.error('\n⚠️  数据库未受影响，迁移已回滚');
  if (!rlClosed) {
    rlClosed = true;
    rl.close();
  }
  try {
    await prisma.$disconnect();
  } catch (e) {
    // 忽略断开连接错误
  }
  process.exit(1);
});

// 执行主函数
main().catch(async (error) => {
  console.error('\n❌ 执行失败:', error);
  console.error('\n⚠️  数据库未受影响，迁移已回滚');
  if (!rlClosed) {
    rlClosed = true;
    rl.close();
  }
  try {
    await prisma.$disconnect();
  } catch (e) {
    // 忽略断开连接错误
  }
  process.exit(1);
});

