const DEFAULT_TYPE = ["int", "char", "float", "void", "double", "string", "bool"]
const DEFAULT_DESCRIBE = ["static", "const"]

const DEFAULT_EXPAND = {
  type: DEFAULT_TYPE,
  describe: DEFAULT_DESCRIBE
}

const EMPTY = 0b00000

const KEYWORD_FLAG = 0b00001
// 关键字
const AUTO = 1 // auto
const BREAK = 2 // break
const CASE = 3 // case
const CHAR = 4 // char
const CONST = 5 // const
const CONTINUE = 6 // continue
const DEFAULT = 7 // default
const DO = 8 // do
const DOUBLE = 9 // double
const ELSE = 10 // else
const ENUM = 11 // enum
const EXTERN = 12 // extern
const FLOAT = 13 // float
const FOR = 14 // for
const GOTO = 15 // goto
const IF = 16 // if
const INLINE = 17 // inline
const INT = 18 // int
const LONG = 19 // long
const REGISTER = 20 // register
const RESTRICT = 21 // restrict
const RETURN = 22 // return
const SHORT = 23 // short
const SIGNED = 24 // signed
const SIZEOF = 25 // sizeof
const STATIC = 26 // static
const STRUCT = 27 // struct
const SWITCH = 28 // switch
const TYPEDEF = 29 // typedef
const UNION = 30 // union
const UNSIGNED = 31 // unsigned
const VOID = 32 // void
const VOLATILE = 33 // volatile
const WHILE = 34 // while

const KEYWORD_DESC = "关键字"
const KEYWORD = Object.freeze({
  "auto": AUTO,
  "break": BREAK,
  "case": CASE,
  "char": CHAR,
  "const": CONST,
  "continue": CONTINUE,
  "default": DEFAULT,
  "do": DO,
  "double": DOUBLE,
  "else": ELSE,
  "enum": ENUM,
  "extern": EXTERN,
  "float": FLOAT,
  "for": FOR,
  "goto": GOTO,
  "if": IF,
  "inline": INLINE,
  "int": INT,
  "long": LONG,
  "register": REGISTER,
  "restrict": RESTRICT,
  "return": RETURN,
  "short": SHORT,
  "signed": SIGNED,
  "sizeof": SIZEOF,
  "static": STATIC,
  "struct": STRUCT,
  "switch": SWITCH,
  "typedef": TYPEDEF,
  "union": UNION,
  "unsigned": UNSIGNED,
  "void": VOID,
  "volatile": VOLATILE,
  "while": WHILE,

  KEYWORD_FLAG,
  KEYWORD_DESC,
})

const IDENTIFIER_FLAG = 0b00010
// 标识符
const IDENTIFIER_MARK = 1
const IDENTIFIER_DESC = "标识符"
const IDENTIFIER_REGEXP = /[_a-zA-Z][_a-zA-Z0-9]*/
const IDENTIFIER = Object.freeze({
  IDENTIFIER_MARK,
  IDENTIFIER_FLAG,
  IDENTIFIER_DESC,
  IDENTIFIER_REGEXP,
})

const CONSTANT_FLAG = 0b00100
// 常量
const INT_CONST = 1 // 整型
const CHAR_CONST = 2 // 字符
const FLOAT_CONST = 3 // 浮点型
const STRING_CONST = 4 // 字符串
const CONSTANT_DESC = "常量"
const CONSTANT = Object.freeze({
  "int": INT_CONST,
  "'": CHAR_CONST,
  "float": FLOAT_CONST,
  "\"": STRING_CONST,

  CONSTANT_FLAG,
  CONSTANT_DESC,
})

const OPERATOR_FLAG = 0b01000
// 运算符
const ADD = 1 // +
const SUB = 2 // -
const MUL = 3 // *
const DIV = 4 // /
const MOD = 5 // %
const ASSIGN = 6 // =
const ADD_ASSIGN = 7 // +=
const SUB_ASSIGN = 8 // -=
const MUL_ASSIGN = 9 // *=
const DIV_ASSIGN = 10 // /=
const MOD_ASSIGN = 11 // %=
const AND_ASSIGN = 12 // &=
const XOR_ASSIGN = 13 // ^=
const OR_ASSIGN = 14 // |=
const LSHIFT_ASSIGN = 15 // <<=
const RSHIFT_ASSIGN = 16 // >>=
const OR = 17 // ||
const AND = 18 // &&
const NOT = 19 // !
const EQ = 20 // ==
const NEQ = 21 // !=
const GT = 22 // >
const LT = 23 // <
const GEQ = 24 // >=
const LEQ = 25 // <=
const SELF_ADD = 26 // ++
const SELF_SUB = 27 // --
const BIT_AND = 28 // &
const BIT_XOR = 29 // ^
const BIT_OR = 30 // |
const LSHIFT = 31 // <<
const RSHIFT = 32 // >>
const OPERATOR_DESC = "运算符"
const OPERATOR = Object.freeze({
  "+": ADD,
  "-": SUB,
  "*": MUL,
  "/": DIV,
  "%": MOD,
  "=": ASSIGN,
  "+=": ADD_ASSIGN,
  "-=": SUB_ASSIGN,
  "*=": MUL_ASSIGN,
  "/=": DIV_ASSIGN,
  "%=": MOD_ASSIGN,
  "&=": AND_ASSIGN,
  "^=": XOR_ASSIGN,
  "|=": OR_ASSIGN,
  "<<=": LSHIFT_ASSIGN,
  ">>=": RSHIFT_ASSIGN,
  "||": OR,
  "&&": AND,
  "!": NOT,
  "==": EQ,
  "!=": NEQ,
  ">": GT,
  "<": LT,
  ">=": GEQ,
  "<=": LEQ,
  "++": SELF_ADD,
  "--": SELF_SUB,
  "&": BIT_AND,
  "^": BIT_XOR,
  "|": BIT_OR,
  "<<": LSHIFT,
  ">>": RSHIFT,

  OPERATOR_FLAG,
  OPERATOR_DESC,
})

const SEPARATOR_FLAG = 0b10000
// 限界符
const LBRACE = 1 // {
const RBRACE = 2 // }
const LPAREN = 3 // (
const RPAREN = 4 // )
const LBRACKET = 5 // [
const RBRACKET = 6 // ]
const COMMA = 7 // ,
const SEMICOLON = 8 // ;
const DOT = 9 // .

const SEPARATOR_DESC = "限界符"
const SEPARATOR = Object.freeze({
  "{": LBRACE,
  "}": RBRACE,
  "(": LPAREN,
  ")": RPAREN,
  "[": LBRACKET,
  "]": RBRACKET,
  ",": COMMA,
  ";": SEMICOLON,
  ".": DOT,

  SEPARATOR_FLAG,
  SEPARATOR_DESC,
})

module.exports = {
  KEYWORD,
  IDENTIFIER,
  CONSTANT,
  OPERATOR,
  SEPARATOR,
  FLAG: {
    EMPTY,
    KEYWORD: KEYWORD_FLAG,
    IDENTIFIER: IDENTIFIER_FLAG,
    CONSTANT: CONSTANT_FLAG,
    OPERATOR: OPERATOR_FLAG,
    SEPARATOR: SEPARATOR_FLAG,
  },
  DESC: {
    KEYWORD: KEYWORD_DESC,
    IDENTIFIER: IDENTIFIER_DESC,
    CONSTANT: CONSTANT_DESC,
    OPERATOR: OPERATOR_DESC,
    SEPARATOR: SEPARATOR_DESC,
  },
  DEFAULT_EXPAND,
}
