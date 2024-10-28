#include <stdio.h>
void main()
{
	int num1, num2, num3;
	int max;
	num1 = 5;
	num2 = 6;
	num3 = 4;
	string test = "test";
	bool test2 = true;
	if (num1 < num2) // a<b时候，最大值暂定为b
	{
		max = num2;
	}
	else if (num1 < num3) /*a>b且a<c时候，最大值为c
												 */
	{
		max = num3;
	}
	else /*a>b且a>c时候，\\最大值为a
				*/
	{
		max = num1;
	}
	if (num2 < num3) /*a<b且b<c时候，\*最大值为c

		*/
	{
		max = num3;
	}
	else /*a<b且b<c时候，"最大值为c"

	 */
	{
		max = num2;
	}
	/** // test */
	/**
	 // test
	 */
	// /*
	///
	printf('//testse');
	printf("\\较大的数是：\*%d*\n", max);
	printf("//\\/*
					//aaaa
					\""
					\*/
					asjhdvkfj
					*/较大的数是：\*%d*\n",max);
	printf('//testse);
	// 常量范围内注释不该被消除"
	return 0;
}